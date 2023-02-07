// Copyright (c) Mito

/**
 * This file handles creating comms within both JupyterLab and Notebooks. There is a fair
 * bit of complexity here, a we must handle a variety of failure modes. 
 * 
 * When you save a notebook in lab that has a rendered notebook in it, 
 * the notebook will be saved with the JS output. Thus, when you reopen the notebook (from lab or notebook) 
 * this js code will reexecute. So: Mito will be rendered, a new frontend object representing the comm will be 
 * recreated, and (since it's the first time Mito is being rendered) the analysis will be replayed 
 * from the start (since the backend has already replayed the analysis, this is just a noop).
 * 
 * Now, as is, this isn't a huge problem if you literally just refresh the page. The problem comes 
 * when you restart the kernel, and then refresh the page. Mito renders (again thinking it's the first
 * time it's been rendered), and tries to create a comm. But since no comm has been registered on the 
 * backend already, no messages can be received by the backend, or send from the backend. So the 
 * frontend thinks a comm is created (as Jupyter will happily create a frontend comm even if it doesn't
 * hook up anywhere). 
 * 
 * Thus, we need a way of detecting three distinct cases:
 * 1.   No comm can be created by the frontend (the install is broken, the extension that creates the comm isn't working)
 * 2.   A comm can be created, but it has no connection to the backend, becuase the JS has run but the mitosheet.sheet call
 *      has not been run (the case described in the paragraph above)
 * 3.   The comm has been created and connects successfully to the backend. 
 * 
 * This third case is the one case where we actually have a working mitosheet. In this case, we can 
 * proceded with things going well.
 * 
 * There is additional complexity, due to _when_ the JS that renders the mitosheet actually runs. Specifically,
 * the JS that renders the mitosheet runs _before_ the window.commands have been set / the extension has been
 * setup. So we need take special care to wait around, when we're trying to make the comms, and try and make it
 * for a few seconds.
 * 
 * We solve this just by a) waiting for a bit before giving up on trying to create the frontend comm, and b)
 * manually checking that the comm is hooked up to the backend. If either of these conditions are not true, 
 * we return an error to the user.
 */

import { ConnectionInformation } from "../components/Mito";
import { isInStreamlit } from "../streamlit";
import { waitUntilConditionReturnsTrueOrTimeout } from "../utils/time";
import { isInJupyterLab, isInJupyterNotebook } from "./jupyterUtils";

/**
 * Note the difference between the Lab and Notebook comm interfaces. 
 * 
 * To work, Lab needs to have .open() called on it before sending any messages,
 * and you set the onMsg handler directly. 
 * 
 * Notebook does not need any .open() to be called, and also requires 
 * the message handler to be passed to as on_msg((msg) => handle it).
 * 
 * We need to take special care to ensure we treat any new comms interface how it 
 * expects to be treated, as they are all likely slighly different.
 */
export interface LabComm {
    send: (msg: Record<string, unknown>) => void,
    onMsg: (msg: {content: {data: Record<string, unknown>}}) => void,
    open: () => void;
}
interface NotebookComm {
    send: (msg: Record<string, unknown>) => void,
    on_msg: (handler: (msg: {content: {data: Record<string, unknown>}}) => void) => void,
}
interface StreamlitComm {
    send: (msg: Record<string, unknown>) => void,
    on_msg: (handler: (msg: Record<string, unknown>) => void) => void,
}

export type CommContainer = {
    'type': 'lab',
    'comm': LabComm
} | {
    'type': 'notebook',
    'comm': NotebookComm
} | {
    'type': 'streamlit',
    'comm': StreamlitComm
}

export const MAX_WAIT_FOR_COMM_CREATION = 10_000;

export type CommCreationErrorStatus = 'non_working_extension_error' | 'no_backend_comm_registered_error' | 'non_valid_location_error';
export type CommCreationStatus = 'loading' | 'finished' | CommCreationErrorStatus;

export const getNotebookCommConnectedToBackend = async (comm: NotebookComm): Promise<boolean> => {

    return new Promise((resolve) => {
        const checkForEcho = async () => {
            let echoReceived = false;

            comm.on_msg((msg) => {
                // Wait for the first echo message, and then we know this comm is actually connected
                if (msg.content.data.echo) {
                    echoReceived = true;
                }
            })

            // Give the onMsg a while to run
            await waitUntilConditionReturnsTrueOrTimeout(() => {return echoReceived}, MAX_WAIT_FOR_COMM_CREATION);

            // TODO: do we need to on_msg here, I am not sure how

            return resolve(echoReceived);
        }

        void checkForEcho();
    })
}


export const getNotebookComm = async (commTargetID: string): Promise<CommContainer | CommCreationErrorStatus> => {

    let potentialComm: NotebookComm | undefined = (window as any).Jupyter?.notebook?.kernel?.comm_manager?.new_comm(commTargetID);
    await waitUntilConditionReturnsTrueOrTimeout(async () => {
        potentialComm = (window as any).Jupyter?.notebook?.kernel?.comm_manager?.new_comm(commTargetID);
        return potentialComm !== undefined;
    }, MAX_WAIT_FOR_COMM_CREATION)

    if (potentialComm === undefined) {
        return 'non_working_extension_error';
    } else {
        if (!(await getNotebookCommConnectedToBackend(potentialComm))) {
            return 'no_backend_comm_registered_error'
        } 
        return {
            'type': 'notebook',
            'comm': potentialComm
        };
    }
    
}

export const getLabCommConnectedToBackend = async (comm: LabComm): Promise<boolean> => {

    return new Promise((resolve) => {
        const checkForEcho = async () => {
            // Save the original onMsg
            const originalOnMsg = comm.onMsg;

            let echoReceived = false;

            comm.onMsg = (msg) => {
                // Wait for the first echo message, and then we know this comm is actually connected
                if (msg.content.data.echo) {
                    echoReceived = true;
                }
            }

            // Give the onMsg a while to run, quiting early if we get an echo
            await waitUntilConditionReturnsTrueOrTimeout(() => {return echoReceived}, MAX_WAIT_FOR_COMM_CREATION);

            // Reset the onMsg
            comm.onMsg = originalOnMsg;

            return resolve(echoReceived);
        }

        void checkForEcho();
    })
}


export const getLabComm = async (kernelID: string, commTargetID: string): Promise<CommContainer | CommCreationErrorStatus> => {
    // Potentially returns undefined if the command is not yet started
    let potentialComm: LabComm | 'no_backend_comm_registered_error' | undefined = undefined;

    await waitUntilConditionReturnsTrueOrTimeout(async () => {
        try {
            potentialComm = await window.commands?.execute('mitosheet:create-mitosheet-comm', {kernelID: kernelID, commTargetID: commTargetID});
        } catch (e) {
            // If we hit an explit error, then stop early as this likely mean the plugin does not exist
            console.error(e);
            return true;
        }
        // We don't return true until we get a comm
        return potentialComm !== undefined && potentialComm !== 'no_backend_comm_registered_error';
    }, MAX_WAIT_FOR_COMM_CREATION)


    if (potentialComm === undefined) {
        return 'non_working_extension_error'
    } else if (potentialComm === 'no_backend_comm_registered_error') { 
        return 'no_backend_comm_registered_error'
    } else {
        /**
         * If we have successfully made a comm, we need to manually open this comm before we 
         * use it. This is required on lab, but not on notebook.
         */
        (potentialComm as LabComm).open() // TODO: why do I have to do this cast? Seems like a complier issue
        
        if (!(await getLabCommConnectedToBackend(potentialComm))) {
            return 'no_backend_comm_registered_error'
        } else {
            return {
                'type': 'lab',
                'comm': potentialComm
            };
        }
    }
}


// Creates a comm that is open and ready to send messages on, and
// returns it with a label so we know what sort of comm it is
export const getCommContainer = async (connectionInformation: ConnectionInformation, setStreamlitOnMsg: React.Dispatch<React.SetStateAction<((msg: any) => void) | undefined>>
): Promise<CommContainer | CommCreationErrorStatus> => {
    if (connectionInformation.type == 'jupyter') {
        if (isInJupyterNotebook()) {
            return getNotebookComm(connectionInformation.commTargetID);
        } else if (isInJupyterLab()) {
            return getLabComm(connectionInformation.kernelID, connectionInformation.commTargetID);
        }
    } else {
        if (isInStreamlit()) {
            // We need to make a streamlit comm
            const allMessages: any = [];
            return {
                'type': 'streamlit',
                'comm': {
                    'send': (msg) => {
                        allMessages.push(msg); 
                        connectionInformation.setComponentValue(allMessages);
                    },
                    'on_msg': (handler) => {console.log("HANLDER", handler), setStreamlitOnMsg(handler);}
                }
            }

        }
    }

    return 'non_valid_location_error'
}
