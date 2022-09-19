// Copyright (c) Mito

import React from 'react';
import SheetTab from './SheetTab';

// import css
import "../../../css/footer.css"
import MitoAPI from '../../jupyter/api';
import { TaskpaneType } from '../taskpanes/taskpanes';
import PlusIcon from '../icons/PlusIcon';
import { EditorState, GraphDataDict, GridState, SheetData, UIState } from '../../types';

type FooterProps = {
    sheetDataArray: SheetData[];
    graphDataDict: GraphDataDict;
    gridState: GridState;
    setGridState: React.Dispatch<React.SetStateAction<GridState>>;
    mitoAPI: MitoAPI;
    closeOpenEditingPopups: () => void;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoContainerRef: React.RefObject<HTMLDivElement>;
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>
};

/*
    Wrapper component that displays the entire footer of the sheet, including
    the sheet tabs, as well as the shape of the currently selected dataframe.
*/
function Footer(props: FooterProps): JSX.Element {

    const selectedSheetIndex = props.uiState.selectedSheetIndex
    const selectedGraphID = props.uiState.selectedGraphID
    const selectedTabType = props.uiState.selectedTabType

    // Get the sheet index to display the rows and columns of. 
    // If the sheet tab is a graph, then display the info from the data being graphed 
    const sheetIndex = selectedTabType === 'graph' && selectedGraphID !== undefined && props.graphDataDict[selectedGraphID] !== undefined ? 
        props.graphDataDict[selectedGraphID].graphParams.graphCreation.sheet_index : selectedSheetIndex
    const sheetData: SheetData | undefined = props.sheetDataArray[sheetIndex]

    return (
        <div className='footer'>
            <div
                className='footer-add-button'
                onClick={() => {
                    props.setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenTaskpane: {type: TaskpaneType.IMPORT}
                        }
                    })
                }}
            >
                <PlusIcon/>
            </div>
            <div className="footer-tab-bar scrollbar-gutter">
                {/* First add the data tabs, and then add the graph tabs */}
                {props.sheetDataArray.map(df => df.dfName).map((dfName, idx) => {
                    return (
                        <SheetTab
                            key={idx}
                            tabName={dfName}
                            tabIDObj={{tabType: 'data', sheetIndex: idx}}
                            isSelectedTab={selectedTabType === 'data' && idx === selectedSheetIndex}
                            setUIState={props.setUIState}
                            closeOpenEditingPopups={props.closeOpenEditingPopups}
                            mitoAPI={props.mitoAPI}
                            mitoContainerRef={props.mitoContainerRef}
                            graphDataDict={props.graphDataDict}
                            sheetDataArray={props.sheetDataArray}
                            setEditorState={props.setEditorState}
                        />
                    )
                })}
                {Object.entries(props.graphDataDict || {}).map(([graphID, graphData]) => {
                    return (
                        <SheetTab
                            key={graphID}
                            tabName={graphData.graphTabName}
                            tabIDObj={{tabType: 'graph', graphID: graphID}}
                            isSelectedTab={selectedTabType === 'graph' && graphID === selectedGraphID}
                            setUIState={props.setUIState}
                            closeOpenEditingPopups={props.closeOpenEditingPopups}
                            mitoAPI={props.mitoAPI}
                            mitoContainerRef={props.mitoContainerRef}
                            graphDataDict={props.graphDataDict}
                            sheetDataArray={props.sheetDataArray}
                            setEditorState={props.setEditorState}
                        />
                    )
                })}
            </div>

            {sheetData !== undefined && 
                <div className='footer-right-side'>
                    <div className='footer-sheet-shape'>
                        ({sheetData.numRows} rows, {sheetData.numColumns} cols)
                    </div>
                </div>
            }
        </div>
    );
}

export default Footer;
