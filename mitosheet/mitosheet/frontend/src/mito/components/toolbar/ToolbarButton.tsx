// Copyright (c) Mito

import React from 'react';
import { Action, EditorState } from '../../types';
import { classNames } from '../../utils/classNames';
import { getToolbarItemIcon, ToolbarButtonType } from './utils';

/**
 * The ToolbarButton component is used to create each
 * button in the Toolbar. 
 */ 
const ToolbarButton = (
    props: {
        /** 
        * @param id - An option id to put on the element, so we can grab it elsewhere 
        */
        id?: string;
        /** 
        * @param toolbarButtonType - The toolbaryItemType is used to determine the correct icon to display. 
        */
        toolbarButtonType: ToolbarButtonType;

        /** 
        * @param action - The action to run when the toolbar button is clicked
        */
        action: Action;

        /** 
        * @param [setEditorState] - pass this if you want to close an open editor
        */
        setEditorState?: React.Dispatch<React.SetStateAction<EditorState | undefined>>;
        
        /**
        * @param [highlightToolbarButton] - Used to draw attention to the toolbar item. Defaults to False. 
        */ 
        highlightToolbarButton?: boolean; 

        /**
        * @param [disabledTooltip] - Set to a string if you want the tooltip to display
        */
        disabledTooltip?: string | undefined

        /**
        * @param [children] - A dropdown opened by the toolbar button
        */
        children?: JSX.Element

    }): JSX.Element => {

    const disabled = props.disabledTooltip !== undefined;
    const highlightToobarItemClass = props.highlightToolbarButton === true ? 'toolbar-button-draw-attention' : ''

    return (
        <div 
            className={classNames('toolbar-button-container', disabled ? 'toolbar-button-container-disabled' : 'toolbar-button-container-enabled')} 
            id={props.id}
            onClick={() => {
                if (disabled) {
                    return
                }

                if (props.setEditorState) {
                    props.setEditorState(undefined);
                }
                props.action.actionFunction();
            }}
        >
            <button 
                className={classNames('toolbar-button', 'vertical-align-content', highlightToobarItemClass)} 
                type="button"
            >
                {/* 
                    The spacing of this button relies on the height of the icon itself! Note that all of the icons 
                    that we use have consistent heights. We leave it this way to force ourselves to design consistent 
                    icons. 
                    
                    If the icons have different heights, the text won't line up. 
                */}
                <span title={props.disabledTooltip || props.action.tooltip}>
                    <div className='toolbar-button-icon-container'>
                        {getToolbarItemIcon(props.toolbarButtonType)}
                    </div>
                    <p className='toolbar-button-label'> 
                        {props.action.shortTitle}
                    </p>
                </span>
            </button>
            {props.children !== undefined && props.children}
        </div>
    );
}

export default ToolbarButton;