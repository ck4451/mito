// Copyright (c) Mito

import React from 'react';

// Import css
import "../../../css/FormulaBar.css";
import "../../../css/mito.css"
import { EditorState, SheetData, MitoSelection, GridState, UIState } from '../../types';
import { getFullFormula } from './celleditor/cellEditorUtils';
import { getCellDataFromCellIndexes } from './utils';
import Col from '../layout/Col';
import Row from '../layout/Row';
import MitoAPI from '../../jupyter/api';
import { calculateCurrentSheetView } from './sheetViewUtils';
import CellEditor from './celleditor/CellEditor';
import { getDisplayColumnHeader } from '../../utils/columnHeaders';
import { TaskpaneType } from '../taskpanes/taskpanes';

const FormulaBar = (props: {
    sheetData: SheetData,
    sheetIndex: number,
    gridState: GridState,
    editorState: EditorState | undefined,
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>,
    setGridState: React.Dispatch<React.SetStateAction<GridState>>,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>,
    scrollAndRenderedContainerRef: React.RefObject<HTMLDivElement>,
    containerRef: React.RefObject<HTMLDivElement>,
    mitoAPI: MitoAPI,
    selection: MitoSelection,
    closeOpenEditingPopups: (taskpanesToKeepIfOpen?: TaskpaneType[]) => void;
}): JSX.Element => {

    const rowIndex = props.selection.startingRowIndex
    const colIndex = props.selection.startingColumnIndex

    const {columnHeader, columnFormula, cellValue} = getCellDataFromCellIndexes(props.sheetData, rowIndex, colIndex);
    const originalFormulaBarValue = '' + (columnFormula !== undefined && columnFormula !== '' ? columnFormula : (cellValue !== undefined ? cellValue : ''));
    const cellEditingCellData = props.editorState === undefined ? undefined : getCellDataFromCellIndexes(props.sheetData, props.editorState.rowIndex, props.editorState.columnIndex);
    const formulaBarColumnHeader = props.editorState === undefined ? columnHeader : cellEditingCellData?.columnHeader;

    let formulaBarValue = '' 
    if (props.editorState === undefined) {
        // If the formula bar is a cell, display the cell value. If it is a column header, display the column header
        if (rowIndex == -1 && columnHeader !== undefined) {
            formulaBarValue = getDisplayColumnHeader(columnHeader)
        } else {
            formulaBarValue = originalFormulaBarValue;
        }
    } else {
        // If we're editing, display the formula
        formulaBarValue = getFullFormula(props.editorState.formula, formulaBarColumnHeader || '', props.editorState.pendingSelectedColumns);
    }

    const currentSheetView = calculateCurrentSheetView(props.gridState);

    return(
        <Row 
            align='center'
            // Add a border to the top and bottom of the formula bar
            style={{
                borderTop: '1px solid var(--mito-border)',
                borderBottom: '1px solid var(--mito-border)',
                background: 'white'
            }}
            suppressTopBottomMargin
        >
            <Col offset={.5}>
                <p className="formula-bar-column-header text-header-3 text-overflow-hide">
                    {formulaBarColumnHeader}
                </p>
            </Col>
            <Col>
                <div className="formula-bar-vertical-line"/>
            </Col>
            <Col flex='1'>
                {props.editorState?.editorLocation === 'formula bar' &&
                    <CellEditor
                        sheetData={props.sheetData}
                        sheetIndex={props.sheetIndex}
                        gridState={props.gridState}
                        editorState={props.editorState}
                        setEditorState={props.setEditorState}
                        setGridState={props.setGridState}
                        setUIState={props.setUIState}
                        scrollAndRenderedContainerRef={props.scrollAndRenderedContainerRef}
                        containerRef={props.containerRef}
                        mitoAPI={props.mitoAPI}
                        currentSheetView={currentSheetView}
                        closeOpenEditingPopups={props.closeOpenEditingPopups}
                    />
                } 
                {props.editorState?.editorLocation !== 'formula bar' &&
                    <div 
                        className="formula-bar-formula text-header-3 text-overflow-hide element-width-block" 
                        onDoubleClick={() => {
                            props.setEditorState({
                                rowIndex: rowIndex,
                                columnIndex: colIndex,
                                formula: formulaBarValue,
                                arrowKeysScrollInFormula: true,
                                editorLocation: 'formula bar',
                                editingMode: 'set_column_formula'
                            })
                        }}
                    >
                        {formulaBarValue}
                    </div>
                }
            </Col>
        </Row>
    )
}

export default FormulaBar
