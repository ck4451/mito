// Copyright (c) Mito

import React, { useEffect } from 'react';
import MitoAPI, { getRandomId } from '../../jupyter/api';
import { GraphDataDict, GraphID, GraphSidebarTab, UIState } from '../../types';
import Dropdown from '../elements/Dropdown';
import DropdownItem from '../elements/DropdownItem';
import DropdownSectionSeperator from '../elements/DropdownSectionSeperator';
import { TaskpaneType } from '../taskpanes/taskpanes';


/*
    Displays a set of actions one can perform on a graph sheet tab, including
    deleting, duplicating, or renaming.
*/
export default function GraphSheetTabActions(props: {
    setDisplayActions: React.Dispatch<React.SetStateAction<boolean>>,
    setIsRename: React.Dispatch<React.SetStateAction<boolean>>;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    closeOpenEditingPopups: () => void;
    mitoAPI: MitoAPI,
    graphID: GraphID,
    graphDataDict: GraphDataDict;
    display: boolean;
}): JSX.Element {

    // Log opening the graph sheet tab actions
    useEffect(() => {
        if (props.display) {
            void props.mitoAPI.log(
                'clicked_graph_sheet_tab_actions',
                {
                    graph_id: props.graphID
                }
            )
        }
    }, [props.display])

    const onDelete = async (): Promise<void> => {
        // Close 
        props.closeOpenEditingPopups();

        await props.mitoAPI.editGraphDelete(props.graphID)
    }

    const onDuplicate = async (): Promise<void> => {
        // Close 
        props.closeOpenEditingPopups();
        
        // Duplicate the graph
        const newGraphID = getRandomId()
        await props.mitoAPI.editGraphDuplicate(props.graphID, newGraphID)
    }

    /* Rename helper, which requires changes to the sheet tab itself */
    const onRename = (): void => {
        props.setIsRename(true);
    }

    const openExportGraphTaskpaneTab = async (): Promise<void> => {
        props.setUIState(prevUIState => {
            return {
                ...prevUIState,
                currOpenTaskpane: {
                    type: TaskpaneType.GRAPH, 
                    graphID: props.graphID, 
                    graphSidebarTab: GraphSidebarTab.Export
                },
            }
        })
    }
    
    return (
        <Dropdown
            display={props.display}
            closeDropdown={() => props.setDisplayActions(false)}
            width='small'
        >
            <DropdownItem
                title='Export'
                onClick={(e) => {
                    // Stop propogation so that the onClick of the sheet tab div
                    // doesn't compete setting the currOpenTaskpane
                    e?.stopPropagation()
                    void openExportGraphTaskpaneTab()
                }}
            />
            <DropdownSectionSeperator isDropdownSectionSeperator={true} />
            <DropdownItem 
                title='Duplicate'
                onClick={onDuplicate}
            />
            <DropdownItem 
                title='Rename'
                onClick={onRename}
                supressFocusSettingOnClose
            />
            <DropdownItem 
                title='Delete'
                onClick={(e) => {
                    // Stop propogation so that the onClick of the sheet tab div
                    // doesn't compete updating the uiState to the graphID that is getting deleted
                    e?.stopPropagation()
                    void onDelete()
                }}
            />
        </Dropdown>
    )
}
