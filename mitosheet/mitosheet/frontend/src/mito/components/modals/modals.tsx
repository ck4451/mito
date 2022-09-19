// Copyright (c) Mito

import { MitoError } from "../../types";


export enum ModalEnum {
    None = 'None',
    Error = 'Error',
    ClearAnalysis = 'ClearAnalysis',
    Import = "Import",
    SignUp = "SignUp",
    Upgrade = 'Upgrade',
    Feedback = 'Feedback',
    DeleteGraphs = 'DeleteGraphs',
    ErrorReplayedAnalysis = 'ErrorReplayAnalysis',
}

/* 
    Each modal comes with modal info, and we enforce (through types) that if you set
    the current modal, you must also pass it the data that it requires. 

    To see what information a modal requires, see it's <>ModalInfo type definition
    below!

    NOTE: Currently, the column header modal is the only modal that needs any data...
    but this is a good investment for the future :)
*/
interface NoneModalInfo {type: ModalEnum.None}
interface ErrorModalInfo {
    type: ModalEnum.Error;
    error: MitoError
}

interface SignUpModalInfo {
    type: ModalEnum.SignUp;
}

interface UpgradeModalInfo {
    type: ModalEnum.Upgrade;
}

interface ClearAnalysisInfo {
    type: ModalEnum.ClearAnalysis;
}
interface ErrorReplayedAnalysisInfo {
    type: ModalEnum.ErrorReplayedAnalysis;
    header: string,
    message: string,
    error: MitoError | undefined;
    oldAnalysisName: string;
    newAnalysisName: string;
}

interface DeleteGraphsModalInfo {
    type: ModalEnum.DeleteGraphs;
    sheetIndex: number;
    dependantGraphTabNamesAndIDs: {
        graphTabName: string;
        graphID: string;
    }[]
}

export type ModalInfo = 
    | NoneModalInfo 
    | ErrorModalInfo
    | SignUpModalInfo
    | UpgradeModalInfo
    | ClearAnalysisInfo
    | DeleteGraphsModalInfo
    | ErrorReplayedAnalysisInfo
