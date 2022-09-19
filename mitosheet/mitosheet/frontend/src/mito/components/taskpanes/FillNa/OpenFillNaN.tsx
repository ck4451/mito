import React from 'react';
import { ColumnID, UIState } from '../../../types';
import { TaskpaneType } from '../taskpanes';


const OpenFillNaN = (props: {setUIState: React.Dispatch<React.SetStateAction<UIState>>, columnID: ColumnID}): JSX.Element => {
    return (
        <>
            &nbsp;
            <span 
                className='text-color-medium-gray-important text-underline-on-hover'
                onClick={() => {
                    props.setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenTaskpane: {type: TaskpaneType.FILL_NA, startingColumnIDs: [props.columnID]},
                        }
                    })
                }}
            >
                (or Fill NaN Values)
            </span>
        </>
    )
}

export default OpenFillNaN;