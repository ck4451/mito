





from functools import wraps
from typing import Any, Callable
from datetime import datetime, timedelta

import pandas as pd
from pandas.core.window import Rolling
from mitosheet.public.v3.types.utils import CONVERSION_FUNCTIONS

from mitosheet.types import PrimitiveTypeName

def is_primitive_value(value: Any) -> bool:
    return isinstance(value, str) or \
        isinstance(value, int) or \
        isinstance(value, float) or \
        isinstance(value, bool) or \
        isinstance(value, datetime) or \
        isinstance(value, timedelta)
        # TODO: nan here?

def cast_values_in_arg_to_type(
    target_primitive_type_name: PrimitiveTypeName,
) -> Callable:

    def wrap(sheet_function):
        @wraps(sheet_function)
        def wrapped_sheet_function(*args):   

            final_args = []
            conversion_function = CONVERSION_FUNCTIONS[target_primitive_type_name]

            # For every arguement, go through and cast them to the correct type
            for arg in args:

                if is_primitive_value(arg):
                    final_args.append(conversion_function(arg))
                
                elif isinstance(arg, pd.Series):
                    final_args.append(arg.apply(conversion_function)) # Why doesn't type work?

                elif isinstance(arg, pd.DataFrame):
                    final_args.append(arg.apply(lambda c: c.apply(conversion_function)))

                elif isinstance(arg, Rolling):
                    obj = arg.obj
                    if isinstance(obj, pd.Series):
                        new_obj = obj.apply(conversion_function)
                    else:
                        new_obj = obj.apply(lambda c: c.apply(conversion_function))

                    final_args.append(new_obj.rolling(window=arg.window))
                
            return sheet_function(*final_args)        
        return wrapped_sheet_function
    return wrap
