import { FileElement } from "../components/taskpanes/FileImport/FileImportTaskpane";



export const inRootFolder = (pathParts: string[]): boolean => {
    pathParts = pathParts.filter(pathPart => pathPart !== '')
    return pathParts.length === 1 && (pathParts[0] === '/' || pathParts[0] === '\\');
}


export const isExcelFile = (element: FileElement | undefined): boolean => {
    return element !== undefined && !element?.isDirectory && 
        (element?.name.toLowerCase().endsWith('.xlsx') ||
        element?.name.toLowerCase().endsWith('.xlsm'))
}


/* 
    Helper function that gets an ending of a file, or
    undefined if no such file ending exists
*/
export const getFileEnding = (elementName: string): string | undefined => {
    try {
        // Take just the file ending
        const nameSplit = elementName.split('.');
        return nameSplit[nameSplit.length - 1];
    } catch {
        return undefined;
    }
}

export const isPathToFolder = (path: string): boolean => {
    return path.endsWith('/') || path.endsWith('\\');
}

export const isPathFromRoot = (path: string): boolean => {
    return path.startsWith('/') || path.startsWith('\\');
}

export const isPathFromCurrentFolderWithNoDot = (path: string): boolean => {
    return isPathToFolder(path) && !isPathFromRoot(path) && !path.includes('.');
}

export const splitPathToParts = (path: string): string[] => {
    const parts = path.split('/').filter(pathPart => pathPart !== '');

    // If the path starts with /, we want to keep the / as a part so we know we're going from the root
    if (isPathFromRoot(path)) {
        return ['/', ...parts];
    }
    
    return parts;
}

export const splitPathToPartsIgnoringFileIfExists = (path: string): string[] => {
    if (path === '/' || path === '\\') {
        return ['/'];
    }

    const pathParts = splitPathToParts(path);

    const lastPathPart = pathParts[pathParts.length - 1];
    if (lastPathPart.includes('.')) {
        pathParts.pop();
    }
    return pathParts;
}
