import React from "react";
import { ColumnFilters, ColumnHeader, ColumnID, DataframeID, FormatTypeObj, GridState, SheetData } from "../../types";
import { classNames } from "../../utils/classNames";
import { isBoolDtype, isDatetimeDtype, isFloatDtype, isIntDtype, isTimedeltaDtype } from "../../utils/dtypes";
import { getWidthDataMap } from "./widthUtils";


export const isNumberInRangeInclusive = (num: number, start: number, end: number): boolean => {
    return start <= num && num <= end;
}

/* 
    A helper function for getting the first non-null or undefined
    value from a list of arguments.

    NOTE: May cause issues with all null or undefined values
*/
export function firstNonNullOrUndefined<T>(...args: (T | null | undefined)[]): T {
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg !== null && arg !== undefined) {
            return arg;
        }
    }

    // NOTE: make sure one of the options is null or undefined
    return args[0] as T;
}


/**
 * Get the grid state of a sheet that was just rendered/switched to.
 */
export const getDefaultGridState = (sheetDataMap: Record<DataframeID, SheetData>, selectedDataframeID: DataframeID): GridState => {

    return {
        dataframeID: selectedDataframeID,
        viewport: {
            width: 0,
            height: 0,
        },
        scrollPosition: {
            scrollLeft: 0,
            scrollTop: 0
        },
        selections: [{
            startingColumnIndex: 0,
            endingColumnIndex: 0,
            startingRowIndex: -1,
            endingRowIndex: -1
        }],
        widthDataMap: getWidthDataMap(selectedDataframeID, sheetDataMap),
        columnIDsMaps: getColumnIDsMapFromSheetDataMap(sheetDataMap),
        searchString: ''
    }
}


// Returns an JSX Element with the type identifier for that type of column
export const getTypeIdentifier = (columnDtype: string, purpleOrDark?: 'purple' | 'dark'): JSX.Element => {
    // Default to identifying the column as a string if we can't figure out what it is
    let typeText = 'str'
    if (isFloatDtype(columnDtype)) {
        typeText = 'float'
    } else if (isIntDtype(columnDtype)) {
        typeText = 'int'
    } else if (isDatetimeDtype(columnDtype)) {
        typeText = 'date'
    } else if (isTimedeltaDtype(columnDtype)) {
        typeText = 'time'
    } else if (isBoolDtype(columnDtype)) {
        typeText = 'bool'
    }

    return <p className={classNames(
        'text-subtext-1',
        { 'text-color-mito-purple-important': purpleOrDark === 'purple' },
        { 'text-color-gray-important': purpleOrDark === 'dark' })}
    >
        {typeText}
    </p>
}


/**
 * A helper function to get data describing a cell from
 * indexes, in a type safe way.
 */
export const getCellDataFromCellIndexes = (sheetData: SheetData | undefined, rowIndex: number, columnIndex: number): {
    columnID: ColumnID | undefined,
    columnHeader: ColumnHeader | undefined,
    columnDtype: string | undefined,
    columnFormula: string | undefined,
    cellValue: string | number | boolean | undefined,
    columnFilters: ColumnFilters | undefined,
    columnFormatType: FormatTypeObj | undefined
} => {
    const columnID: string | undefined = sheetData?.data[columnIndex]?.columnID;
    const columnHeader = sheetData?.data[columnIndex]?.columnHeader;
    const columnFormula = columnID !== undefined ? sheetData?.columnSpreadsheetCodeMap[columnID] : undefined;
    const columnDtype = columnID !== undefined ? sheetData?.data[columnIndex].columnDtype : undefined;
    const columnFilters = columnID !== undefined ? sheetData?.columnFiltersMap[columnID] : undefined;
    const cellValue = columnID !== undefined ? sheetData?.data[columnIndex].columnData[rowIndex] : undefined;
    const columnFormatType = columnID !== undefined ? sheetData?.columnFormatTypeObjMap[columnID] : undefined;

    return {
        columnID: columnID,
        columnHeader: columnHeader,
        columnFormula: columnFormula,
        columnDtype: columnDtype,
        columnFilters: columnFilters,
        cellValue: cellValue,
        columnFormatType: columnFormatType
    }
}

/*
    Helper function for creating the ColumnIDsMapping: dataframeID -> columnIndex -> columnID
    from the Sheet Data Map
*/
export const getColumnIDsMapFromSheetDataMap = (sheetDataMap: Record<DataframeID, SheetData>): Record<DataframeID, ColumnID[]> => {
    const columnIDsMap: Record<DataframeID, ColumnID[]> = {};

    Object.entries(sheetDataMap).forEach(([dataframeID, sheetData]) => {
        columnIDsMap[dataframeID] = sheetData.data.map(c => c.columnID);
    });

    return columnIDsMap;
}


export const cellInSearch = (cellValue: string | number | boolean, searchString: string): boolean => {
    if (searchString === '') {
        return false;
    }

    return ('' + cellValue).toLowerCase().search(searchString.toLowerCase()) > -1;
}

/*
    Determines if any sheet exists. Returns True if a sheet exists.
*/
export const doesAnySheetExist = (sheetDataMap: Record<DataframeID, SheetData>): boolean => {
    return Object.keys(sheetDataMap).length !== 0
}

/*
    Determines if a columnID exists in a specific sheet. Returns True
*/
export const doesColumnExist = (columnID: ColumnID | undefined, dataframeID: DataframeID, sheetDataMap: Record<DataframeID, SheetData>): boolean => {
    return columnID !== undefined && sheetDataMap[dataframeID]?.columnDtypeMap[columnID] !== undefined
}

/* 
    Determines if the sheet contains data
*/
export const doesSheetContainData = (dataframeID: DataframeID, sheetDataMap: Record<DataframeID, SheetData>): boolean => {
    const sheetData = sheetDataMap[dataframeID]
    return sheetData !== undefined && sheetData.numRows > 0 && sheetData.numColumns > 0
}

