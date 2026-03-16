"""Utility functions for filter operations."""

import logging
import operator
from pathlib import Path
from datetime import datetime
from typing import Tuple, Callable, List

from bikesim.analysis.filters.models import FilterType

logger = logging.getLogger(__name__)


def parse_operator(operator_str: str, value: float) -> Tuple[Callable, float, str]:
    """
    Parse operator and return the operator function, value, and operator name.

    Args:
        operator_str: Operator string (>, <, >=, <=, ==, !=)
        value: Numeric value to compare against

    Returns:
        Tuple of (operator_function, value, operator_name)
    """
    op_map = {
        ">": (operator.gt, "MAY"),
        "<": (operator.lt, "MEN"),
        ">=": (operator.ge, "MAYIGUAL"),
        "<=": (operator.le, "MENIGUAL"),
        "==": (operator.eq, "IGUAL"),
        "!=": (operator.ne, "DISTINTO")
    }

    op_func, op_name = op_map.get(operator_str, (operator.ge, "MAYIGUAL"))
    return op_func, value, op_name


def build_filter_display(filter_type: FilterType, **kwargs) -> str:
    """
    Build the filter string for display and filename.

    Args:
        filter_type: Type of filter
        **kwargs: Filter parameters

    Returns:
        Formatted filter string
    """
    if filter_type == FilterType.ESTACIONES_DIA:
        return f"{kwargs['operator']}{kwargs['value']}_{kwargs['times_per_day']}_{kwargs['day_index']}"

    elif filter_type == FilterType.ESTACIONES_MES:
        days_str = kwargs['days'].replace('#', '_') if kwargs['days'] != 'all' else 'all'
        return f"{kwargs['operator']}{kwargs['value']}_{kwargs['times_per_day']}_{days_str}_{kwargs['exception_days']}"

    elif filter_type == FilterType.HORAS:
        return f"{kwargs['operator']}{kwargs['value']}_{kwargs['percentage']}"

    elif filter_type == FilterType.PORCENTAJE_TIEMPO:
        stations_str = kwargs['stations'].replace(';', '_')
        return f"{kwargs['operator']}{kwargs['value']}_{stations_str}"

    else:
        raise ValueError(f"Unknown filter type: {filter_type}")


def clean_filename_string(text: str) -> str:
    """
    Clean a string for use in filenames.

    Args:
        text: Input string

    Returns:
        Filename-safe string
    """
    clean = text.replace(';', '_')
    clean = clean.replace('>', 'MAY')
    clean = clean.replace('<', 'MEN')
    clean = clean.replace('>=', 'MAYIGUAL')
    clean = clean.replace('<=', 'MENIGUAL')
    clean = clean.replace('==', 'IGUAL')
    clean = clean.replace('!=', 'DISTINTO')
    return clean


def save_filter_result(
        output_folder: str,
        data: List[int],
        filter_type: FilterType,
        filter_display: str
) -> Path:
    """
    Save filter result to file.

    Args:
        output_folder: Output directory path
        data: Filter result data
        filter_type: Type of filter
        filter_display: Display string for filename

    Returns:
        Path to saved file
    """
    out_dir = Path(output_folder)
    out_dir.mkdir(exist_ok=True, parents=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    clean_display = clean_filename_string(filter_display)

    if filter_type == FilterType.PORCENTAJE_TIEMPO:
        filename = f"{timestamp}_Filtrado_Porcentaje_{clean_display}.txt"
        content = f"{data[0]}%"
    else:
        filename = f"{timestamp}_Filtrado_Estaciones_{clean_display}.csv"
        content = ','.join(map(str, data))

    file_path = out_dir / filename
    file_path.write_text(content, encoding="utf-8")

    logger.info(f"Saved filter result to {file_path}")
    return file_path