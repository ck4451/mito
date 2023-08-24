#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the IF function.
"""

import pytest
import pandas as pd
from mitosheet.errors import MitoError

from mitosheet.public.v3.sheet_functions.bool_functions import IFS

# Raw function tests

IFS_TESTS = [
    (
        [
            pd.Series([True, False]), 'option1',
            pd.Series([False, True]), 'option2'
        ],
        pd.Series(['option1', 'option2'])
    ),
    (
        [
            pd.Series([True, True, False]), 'option1',
            pd.Series([False, True, False]), 'option2',
            pd.Series([True, False, True]), 'option3'
        ],
        pd.Series(['option1', 'option1', 'option3'])
    ),
    (
        [
            pd.Series([False, False, False]), 'option1',
            pd.Series([False, True, True]), 'option2',
            pd.Series([True, False, True]), 'option3'
        ],
        pd.Series(['option3', 'option2', 'option2'])
    ),
    (
        [
            pd.Series([True, False, False]), 1,
            pd.Series([True, True, False]), 2,
            pd.Series([True, False, True]), 3
        ],
        pd.Series([1.0, 2.0, 3.0])
    ),
    (
        [
            pd.Series([True, False, False]), 1,
            pd.Series([True, True, False]), 2,
            pd.Series([True, False, False]), 3
        ],
        pd.Series([1.0, 2.0, None])
    ),
    (
        [
            pd.Series([True, False]), pd.Timestamp('2017-01-01'),
            pd.Series([True, True]), pd.Timestamp('2017-01-04'),
        ],
        pd.Series([pd.Timestamp('2017-01-01'), pd.Timestamp('2017-01-04')])
    ),
    (
        [
            pd.Series([True, False]), pd.Series([1,2]),
            pd.Series([True, True]), pd.Timestamp('2017-01-04'),
        ],
        pd.Series([1, pd.Timestamp('2017-01-04')])
    ),
    (
        [
            pd.Series([True, False]), pd.Series(['option1', 'option2']),
            pd.Series([False, True]), 'option3',
        ],
        pd.Series(['option1', 'option3'])
    ),
    (
        [
            pd.Series([True, False]), pd.Series(['option1', 'option2']),
            True, 'option3',
        ],
        pd.Series(['option1', 'option3'])
    ),
    (
        [
            True, 'option1',
        ],
        'option1'
    ),
    (
        [
            'invalid', 1
        ],
        None
    ),
    (
        [
            False, 'option1'
        ],
        None
    )
]

@pytest.mark.parametrize("_argv, expected", IFS_TESTS)
def test_ifs_direct(_argv, expected):
    result = IFS(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected
