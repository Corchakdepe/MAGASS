"""Matrix manipulation utilities."""

import numpy as np
import pandas as pd
from typing import List, Tuple


def get_hour_indices(days: List[int], hours_per_day: int = 24) -> List[int]:
    """
    Get time indices for specified days.

    Args:
        days: List of day indices
        hours_per_day: Hours per day

    Returns:
        List of time indices
    """
    return [h + d * hours_per_day for d in days for h in range(hours_per_day)]


def get_hour_index_list(days: List[int], hours_per_day: int = 24) -> List[int]:
    """
    Get repeating hour indices for grouping.

    Args:
        days: List of day indices
        hours_per_day: Hours per day

    Returns:
        List of hour indices for grouping
    """
    return [h for _ in days for h in range(hours_per_day)]


def calculate_mean_by_hour(
        matrix: pd.DataFrame,
        days: List[int],
        station_id: int,
        hours_per_day: int = 24
) -> pd.Series:
    """
    Calculate mean values by hour for a station across specified days.

    Args:
        matrix: Data matrix (time x stations)
        days: Days to include
        station_id: Station column index
        hours_per_day: Hours per day

    Returns:
        Series of mean values by hour
    """
    time_indices = get_hour_indices(days, hours_per_day)
    hour_indices = get_hour_index_list(days, hours_per_day)

    x_hours = list(range(hours_per_day))
    values = matrix.iloc[time_indices, station_id].values

    return (
        pd.Series(values)
        .groupby(hour_indices)
        .mean()
        .reindex(x_hours)
    )


def calculate_sum_by_hour(
        matrix: pd.DataFrame,
        days: List[int],
        station_id: int,
        hours_per_day: int = 24
) -> pd.Series:
    """
    Calculate sum values by hour for a station across specified days.

    Args:
        matrix: Data matrix (time x stations)
        days: Days to include
        station_id: Station column index
        hours_per_day: Hours per day

    Returns:
        Series of sum values by hour
    """
    time_indices = get_hour_indices(days, hours_per_day)
    hour_indices = get_hour_index_list(days, hours_per_day)

    x_hours = list(range(hours_per_day))
    values = matrix.iloc[time_indices, station_id].values

    return (
        pd.Series(values)
        .groupby(hour_indices)
        .sum()
        .reindex(x_hours)
    )


def fill_matrix_rows(matrix: pd.DataFrame, target_rows: int) -> pd.DataFrame:
    """
    Fill matrix to target number of rows with zeros.

    Args:
        matrix: Input matrix
        target_rows: Target row count

    Returns:
        Matrix with filled rows
    """
    current_rows = matrix.shape[0]
    if current_rows >= target_rows:
        return matrix

    # Create empty rows
    missing_rows = target_rows - current_rows
    empty = pd.DataFrame(
        np.zeros((missing_rows, matrix.shape[1])),
        columns=matrix.columns
    )

    return pd.concat([matrix, empty], ignore_index=True)


def extract_station_day_data(
        matrix: pd.DataFrame,
        station_id: int,
        days: List[int],
        hours_per_day: int = 24
) -> Tuple[List[int], List[float]]:
    """
    Extract time indices and values for a station on specific days.

    Args:
        matrix: Data matrix
        station_id: Station ID
        days: Day indices
        hours_per_day: Hours per day

    Returns:
        Tuple of (time_indices, values)
    """
    time_indices = get_hour_indices(days, hours_per_day)
    values = matrix.iloc[time_indices, station_id].tolist()
    return time_indices, values
