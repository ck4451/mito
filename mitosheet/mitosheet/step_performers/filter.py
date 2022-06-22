#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import functools
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple
import pandas as pd
from datetime import date
from mitosheet.code_chunks.code_chunk import CodeChunk

from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.state import State
from mitosheet.step_performers.utils import get_param
from mitosheet.types import ColumnHeader, ColumnID

# The constants used in the filter step itself as filter conditions
# NOTE: these must be unique (e.g. no repeating names for different types)
FC_EMPTY = "empty"
FC_NOT_EMPTY = "not_empty"

FC_BOOLEAN_IS_TRUE = "boolean_is_true"
FC_BOOLEAN_IS_FALSE = "boolean_is_false"

FC_STRING_CONTAINS = "contains"
FC_STRING_DOES_NOT_CONTAIN = "string_does_not_contain"
FC_STRING_EXACTLY = "string_exactly"
FC_STRING_NOT_EXACTLY = "string_not_exactly"
FC_STRING_STARTS_WITH = "string_starts_with"
FC_STRING_ENDS_WITH = "string_ends_with"

FC_NUMBER_EXACTLY = "number_exactly"
FC_NUMBER_NOT_EXACTLY = "number_not_exactly"
FC_NUMBER_GREATER = "greater"
FC_NUMBER_GREATER_THAN_OR_EQUAL = "greater_than_or_equal"
FC_NUMBER_LESS = "less"
FC_NUMBER_LESS_THAN_OR_EQUAL = "less_than_or_equal"

FC_DATETIME_EXACTLY = "datetime_exactly"
FC_DATETIME_NOT_EXACTLY = "datetime_not_exactly"
FC_DATETIME_GREATER = "datetime_greater"
FC_DATETIME_GREATER_THAN_OR_EQUAL = "datetime_greater_than_or_equal"
FC_DATETIME_LESS = "datetime_less"
FC_DATETIME_LESS_THAN_OR_EQUAL = "datetime_less_than_or_equal"

# If there are multiple conditions, we combine them together, with the
# given operator in the middle
OPERATOR_SIGNS = {"Or": "|", "And": "&"}

class FilterStepPerformer(StepPerformer):
    """
    Allows you to filter a column based on some conditions and some values.
    """

    @classmethod
    def step_version(cls) -> int:
        return 4

    @classmethod
    def step_type(cls) -> str:
        return "filter_column"

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        column_id: ColumnID = get_param(params, 'column_id')
        operator: str = get_param(params, 'operator')
        filters: Any = get_param(params, 'filters')

        filter_list = {
            'operator': operator,
            'filters': filters
        }

        # Get the correct column_header
        column_header = prev_state.column_ids.get_column_header_by_id(
            sheet_index, column_id
        )

        # Create a new step for this filter
        post_state = prev_state.copy(deep_sheet_indexes=[sheet_index])

        # Get the current bulk filter
        bulk_filter = post_state.column_filters[sheet_index][column_id]['bulk_filter']

        # Execute the filter
        _, _, pandas_processing_time = _execute_filter(
            post_state, sheet_index, column_header, filter_list, bulk_filter
        )

        return post_state, {
            'pandas_processing_time': pandas_processing_time
        }

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        post_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        from mitosheet.code_chunks.step_performers.filter_code_chunk import FilterCodeChunk
        return [
            FilterCodeChunk(prev_state, post_state, params, execution_data)
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')}


def get_applied_filter(
    df: pd.DataFrame, column_header: ColumnHeader, filter_: Dict[str, Any]
) -> pd.Series:
    """
    Given a filter triple, returns the filter indexes for that
    actual dataframe
    """
    condition = filter_["condition"]
    value = filter_["value"]

    # First, check shared filter conditions
    if condition == FC_EMPTY:
        return df[column_header].isna()
    elif condition == FC_NOT_EMPTY:
        return df[column_header].notnull()

    # Then bool
    if condition == FC_BOOLEAN_IS_TRUE:
        return df[column_header] == True
    elif condition == FC_BOOLEAN_IS_FALSE:
        return df[column_header] == False

    # Then string
    if condition == FC_STRING_CONTAINS:
        return df[column_header].str.contains(value, na=False)
    elif condition == FC_STRING_DOES_NOT_CONTAIN:
        return ~df[column_header].str.contains(value, na=False)
    elif condition == FC_STRING_STARTS_WITH:
        return df[column_header].str.startswith(value, na=False)
    elif condition == FC_STRING_ENDS_WITH:
        return df[column_header].str.endswith(value, na=False)
    elif condition == FC_STRING_EXACTLY:
        return df[column_header] == value
    elif condition == FC_STRING_NOT_EXACTLY:
        return df[column_header] != value

    # Then number
    if condition == FC_NUMBER_EXACTLY:
        return df[column_header] == value
    elif condition == FC_NUMBER_NOT_EXACTLY:
        return df[column_header] != value
    elif condition == FC_NUMBER_GREATER:
        return df[column_header] > value
    elif condition == FC_NUMBER_GREATER_THAN_OR_EQUAL:
        return df[column_header] >= value
    elif condition == FC_NUMBER_LESS:
        return df[column_header] < value
    elif condition == FC_NUMBER_LESS_THAN_OR_EQUAL:
        return df[column_header] <= value

    # Check that we were given something that can be understood as a date
    try:
        timestamp = pd.to_datetime(value)
    except:
        # If we hit an error, because we restrict the input datetime,
        # this is probably occuring because the user has only partially input the date,
        # and so in this case, we just default it to the minimum possible timestamp for now!
        timestamp = date.min

    if condition == FC_DATETIME_EXACTLY:
        return df[column_header] == timestamp
    elif condition == FC_DATETIME_NOT_EXACTLY:
        return df[column_header] != timestamp
    elif condition == FC_DATETIME_GREATER:
        return df[column_header] > timestamp
    elif condition == FC_DATETIME_GREATER_THAN_OR_EQUAL:
        return df[column_header] >= timestamp
    elif condition == FC_DATETIME_LESS:
        return df[column_header] < timestamp
    elif condition == FC_DATETIME_LESS_THAN_OR_EQUAL:
        return df[column_header] <= timestamp

    # Then, we check if these are bulk filter conditions
    from mitosheet.step_performers.bulk_filter import BULK_FILTER_CONDITION_IS_NOT_EXACTLY
    if condition == BULK_FILTER_CONDITION_IS_NOT_EXACTLY:
        return ~df[column_header].isin(value)

    raise Exception(f"Invalid type passed in filter {filter_}")


def combine_filters(operator: str, filters: List[Optional[pd.Series]]) -> Optional[pd.Series]:
    def filter_reducer(filter_one: pd.Series, filter_two: pd.Series) -> pd.Series:
        if filter_one is None:
            return filter_two
        if filter_two is None:
            return filter_one

        # Helper for combining filters based on the operations
        if operator == "Or":
            return (filter_one) | (filter_two)
        elif operator == "And":
            return (filter_one) & (filter_two)
        else:
            raise Exception(f"Operator {operator} is unsupported")

    if len(filters) == 0:
        return None

    # Combine all the filters into a single filter
    return functools.reduce(filter_reducer, filters)


def _execute_filter(
    post_state: State,
    sheet_index: int,
    column_id: ColumnID,
    filter_list: Dict[str, Any],
    bulk_filter: Dict[str, Any]
) -> Tuple[pd.DataFrame, pd.DataFrame, float]:
    """
    Executes a filter on the given column, filtering by removing any rows who
    don't meet the condition.
    """

    operator = filter_list['operator']
    filters = filter_list['filters']
    df = post_state.dfs[sheet_index]
    column_header = post_state.column_ids.get_column_header_by_id(sheet_index, column_id)

    applied_filters = []
    pandas_start_time = perf_counter()

    for filter_or_group in filters:

        # If it's a group, then we build the filters for the group, combine them
        # and then add that to the applied filters
        if "filters" in filter_or_group:
            group_filters = []
            for filter_ in filter_or_group["filters"]:
                group_filters.append(get_applied_filter(df, column_header, filter_))

            if len(group_filters) > 0:
                applied_filters.append(
                    combine_filters(filter_or_group["operator"], group_filters)
                )

        # Otherwise, we just get that specific filter, and append it
        else:
            applied_filters.append(
                get_applied_filter(df, column_header, filter_or_group)
            )

    # Get the final filter for the filter list
    filter_list_filter = combine_filters(operator, applied_filters)

    # Then, we combine with the bulk filter with the other filters. We always
    # use an and to combine, as this is what users expect: the filters accept
    # this data, or they have it toggled
    applied_bulk_filter = get_applied_filter(df, column_header, bulk_filter)
    final_filter = combine_filters('And', [filter_list_filter, applied_bulk_filter])
    
    final_df, filtered_out_df = df[final_filter], df[~final_filter]

    pandas_processing_time = perf_counter() - pandas_start_time

    post_state.dfs[sheet_index] = final_df

    # Keep track of the column_filters of both types
    post_state.column_filters[sheet_index][column_id]['filter_list'] = filter_list
    post_state.column_filters[sheet_index][column_id]['bulk_filter'] = bulk_filter

    return final_df, filtered_out_df, pandas_processing_time