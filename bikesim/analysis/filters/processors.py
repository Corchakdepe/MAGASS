"""Filter processing functions."""

import logging
from typing import List

import pandas as pd

from bikesim.analysis.filters.utils import parse_operator

logger = logging.getLogger(__name__)


def apply_filter_estaciones_mes(
        matrix: pd.DataFrame,
        operator_str: str,
        value: float,
        times_per_day: int,
        days_spec: str,
        exception_days: int
) -> List[int]:
    """
    Apply month filter: stations that meet condition for specified days.

    Args:
        matrix: Data matrix
        operator_str: Comparison operator
        value: Threshold value
        times_per_day: Times condition must be met per day
        days_spec: Day specification ('all' or '#-separated list')
        exception_days: Number of exception days allowed

    Returns:
        List of station indices meeting the condition
    """
    op_func, val, op_name = parse_operator(operator_str, value)

    # Parse days
    if days_spec == "all":
        # Calculate number of days (assuming 24 hours per day)
        num_rows = matrix.shape[0]
        days_indices = list(range(num_rows // 24))
        logger.info(f"Using all days: {len(days_indices)} days")
    else:
        days_indices = [int(d) for d in days_spec.split('#') if d.strip()]
        logger.info(f"Using specified days: {days_indices}")

    # Get number of stations (excluding time column)
    num_stations = matrix.shape[1] - 1

    # Track which stations meet condition
    station_counts = {i: 0 for i in range(num_stations)}

    # For each day
    for day_idx in days_indices:
        # Get rows for this day (assuming 24 hours per day)
        start_row = day_idx * 24
        end_row = start_row + 24

        if end_row > matrix.shape[0]:
            logger.warning(f"Day {day_idx} exceeds matrix rows, skipping")
            continue

        day_data = matrix.iloc[start_row:end_row, 1:]  # Exclude time column

        # For each station
        for station_idx in range(num_stations):
            station_values = day_data.iloc[:, station_idx]

            # Count times condition is met
            try:
                times_met = sum(1 for v in station_values if op_func(val, float(v)))
            except (ValueError, TypeError) as e:
                logger.warning(f"Error comparing values for station {station_idx}: {e}")
                times_met = 0

            if times_met >= times_per_day:
                station_counts[station_idx] += 1

    # Filter stations that meet condition for enough days
    min_days = len(days_indices) - exception_days
    result_stations = [s for s, count in station_counts.items() if count >= min_days]

    logger.info(f"Found {len(result_stations)} stations meeting condition")
    return result_stations


def apply_filter_estaciones_dia(
        matrix: pd.DataFrame,
        operator_str: str,
        value: float,
        times_per_day: int,
        day_index: int
) -> List[int]:
    """
    Apply day filter: stations that meet condition on a specific day.

    Args:
        matrix: Data matrix
        operator_str: Comparison operator
        value: Threshold value
        times_per_day: Times condition must be met in the day
        day_index: Day index to filter

    Returns:
        List of station indices meeting the condition

    Raises:
        HTTPException: If day index out of range
    """
    from fastapi import HTTPException

    op_func, val, op_name = parse_operator(operator_str, value)

    # Get rows for this day (assuming 24 hours per day)
    start_row = day_index * 24
    end_row = start_row + 24

    if end_row > matrix.shape[0]:
        raise HTTPException(
            status_code=400,
            detail=f"Day index {day_index} out of range. Max days: {matrix.shape[0] // 24}"
        )

    day_data = matrix.iloc[start_row:end_row, 1:]  # Exclude time column
    num_stations = day_data.shape[1]

    result_stations = []
    for station_idx in range(num_stations):
        station_values = day_data.iloc[:, station_idx]

        try:
            times_met = sum(1 for v in station_values if op_func(val, float(v)))
        except (ValueError, TypeError) as e:
            logger.warning(f"Error comparing values for station {station_idx}: {e}")
            times_met = 0

        if times_met >= times_per_day:
            result_stations.append(station_idx)

    return result_stations


def apply_filter_horas(
        matrix: pd.DataFrame,
        operator_str: str,
        value: float,
        percentage: float
) -> List[int]:
    """
    Apply hours filter: hours where percentage of stations meet condition.

    Args:
        matrix: Data matrix
        operator_str: Comparison operator
        value: Threshold value
        percentage: Required percentage of stations

    Returns:
        List of hour indices meeting the condition
    """
    op_func, val, op_name = parse_operator(operator_str, value)

    num_stations = matrix.shape[1] - 1
    min_stations = (percentage / 100.0) * num_stations

    result_hours = []

    for hour_idx in range(matrix.shape[0]):
        hour_data = matrix.iloc[hour_idx, 1:]  # Exclude time column

        try:
            stations_meeting = sum(1 for v in hour_data if op_func(val, float(v)))
        except (ValueError, TypeError) as e:
            logger.warning(f"Error comparing values at hour {hour_idx}: {e}")
            stations_meeting = 0

        if stations_meeting >= min_stations:
            result_hours.append(hour_idx)

    return result_hours


def apply_filter_porcentaje_tiempo(
        matrix: pd.DataFrame,
        operator_str: str,
        value: float,
        stations_str: str
) -> float:
    """
    Apply time percentage filter: percentage of time stations meet condition simultaneously.

    Args:
        matrix: Data matrix
        operator_str: Comparison operator
        value: Threshold value
        stations_str: Semicolon-separated station indices

    Returns:
        Percentage of time condition is met
    """
    op_func, val, op_name = parse_operator(operator_str, value)

    # Parse stations
    station_indices = [int(s) for s in stations_str.split(';') if s.strip()]

    # Adjust for time column
    station_indices = [s + 1 for s in station_indices]  # +1 to skip time column

    total_hours = matrix.shape[0]
    hours_meeting = 0

    for hour_idx in range(total_hours):
        hour_data = matrix.iloc[hour_idx, station_indices]

        try:
            # Check if all stations meet condition
            if all(op_func(val, float(v)) for v in hour_data):
                hours_meeting += 1
        except (ValueError, TypeError) as e:
            logger.warning(f"Error comparing values at hour {hour_idx}: {e}")
            continue

    percentage = (hours_meeting / total_hours) * 100 if total_hours > 0 else 0
    return percentage