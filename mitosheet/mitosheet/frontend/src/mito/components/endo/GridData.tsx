import React from 'react';
import '../../../css/endo/GridData.css';
import { getBorderStyle, getIsCellSelected } from './selectionUtils';
import { calculateCurrentSheetView } from './sheetViewUtils';
import { EditorState, GridState, SheetData, UIState } from '../../types';
import { classNames } from '../../utils/classNames';
import { getColumnIDsArrayFromSheetDataArray } from './utils';
import { formatCellData } from '../../utils/format';
import { isNumberDtype } from '../../utils/dtypes';


export const EVEN_ROW_BACKGROUND_COLOR_DEFAULT = '#F5F5F5';
export const ODD_ROW_BACKGROUND_COLOR_DEFAULT = '#FFFFFF';
export const EVEN_ROW_TEXT_COLOR_DEFAULT = '#494650'; // This is var(--mito-gray), update if we change variable
export const ODD_ROW_TEXT_COLOR_DEFAULT = '#494650'; // This is var(--mito-gray), update if we change variable



const GridData = (props: {
    sheetData: SheetData | undefined,
    gridState: GridState,
    uiState: UIState
    editorState: EditorState | undefined;
}): JSX.Element => {

    const currentSheetView = calculateCurrentSheetView(props.gridState);
    const sheetData = props.sheetData

    const evenRowBackgroundColor = sheetData?.dfFormat?.rows?.even?.backgroundColor || EVEN_ROW_BACKGROUND_COLOR_DEFAULT;
    const oddRowBackgroundColor = sheetData?.dfFormat?.rows?.odd?.backgroundColor || ODD_ROW_BACKGROUND_COLOR_DEFAULT;
    const evenRowTextColor = sheetData?.dfFormat?.rows?.even?.color || EVEN_ROW_TEXT_COLOR_DEFAULT;
    const oddRowTextColor = sheetData?.dfFormat?.rows?.odd?.color || ODD_ROW_TEXT_COLOR_DEFAULT;

    return (
        <>  
            {sheetData && sheetData.numRows > 0 && Array(currentSheetView.numRowsRendered).fill(0).map((_, _rowIndex) => {
                const rowIndex = currentSheetView.startingRowIndex + _rowIndex;
                const columnIDs = getColumnIDsArrayFromSheetDataArray([sheetData])[0]

                const rowClassNames = classNames('mito-grid-row', {
                    'mito-grid-row-even': rowIndex % 2 === 0,
                    'mito-grid-row-odd': rowIndex % 2 !== 0
                }) 

                const style = rowIndex % 2 === 0 
                    ? {backgroundColor: evenRowBackgroundColor, color: evenRowTextColor} 
                    : {backgroundColor: oddRowBackgroundColor, color: oddRowTextColor};

                return (
                    <div className={rowClassNames} key={rowIndex} style={style}>
                        {Array(currentSheetView.numColumnsRendered).fill(0).map((_, _colIndex) => {
                            const columnIndex = currentSheetView.startingColumnIndex + _colIndex;
                            const columnID = columnIDs[columnIndex]
                            const columnDtype = props.sheetData?.data[columnIndex]?.columnDtype;
                            const columnFormatType = sheetData.dfFormat.columns[columnID]
                            const cellData = props.sheetData?.data[columnIndex]?.columnData[rowIndex];

                            if (cellData === undefined || columnDtype == undefined) {
                                return null;
                            }

                            const className = classNames('mito-grid-cell', 'text-unselectable', {
                                'mito-grid-cell-selected': getIsCellSelected(props.gridState.selections, rowIndex, columnIndex),
                                'mito-grid-cell-hidden': props.editorState !== undefined && props.editorState.rowIndex === rowIndex && props.editorState.columnIndex === columnIndex,
                                'right-align-number-series': isNumberDtype(columnDtype)
                            });

                            const cellWidth = props.gridState.widthDataArray[props.gridState.sheetIndex].widthArray[columnIndex];

                            // Format the cell
                            const displayCellData = formatCellData(cellData, columnDtype, columnFormatType)

                            return (
                                <div 
                                    className={className} key={columnIndex}
                                    style={{
                                        width: `${cellWidth}px`,
                                        ...getBorderStyle(props.gridState.selections, props.gridState.copiedSelections, rowIndex, columnIndex, sheetData.numRows)
                                    }}
                                    tabIndex={-1}
                                    mito-col-index={columnIndex}
                                    mito-row-index={rowIndex}
                                    title={displayCellData}
                                >
                                    {displayCellData}
                                </div>
                            )
                        })}
                    </div>
                )
            })}
        </>
    )
}

export default React.memo(GridData);