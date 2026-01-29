"""Parsing utilities for specifications."""

import re
from typing import Tuple, List, Optional, Callable
import operator


def parse_operator(op_str: str) -> Tuple[Callable, float, str]:
    """
    Parse operator string like '>=5.0' or '<10'.

    Args:
        op_str: Operator string

    Returns:
        Tuple of (operator_function, value, operator_name)
    """
    if op_str.startswith(">="):
        return operator.ge, float(op_str[2:]), ">="
    elif op_str.startswith("<="):
        return operator.le, float(op_str[2:]), "<="
    elif op_str.startswith(">"):
        return operator.gt, float(op_str[1:]), ">"
    elif op_str.startswith("<"):
        return operator.lt, float(op_str[1:]), "<"
    elif op_str.startswith("=="):
        return operator.eq, float(op_str[2:]), "=="
    else:
        raise ValueError(f"Unknown operator in: {op_str}")


def parse_map_spec(spec: str) -> Tuple[List[int], Optional[List[int]], bool]:
    """
    Parse map specification string.

    Format: "inst1;inst2[+est1;est2;...][-L]"

    Args:
        spec: Map specification string

    Returns:
        Tuple of (instants, stations, show_labels)
    """
    show_labels = False
    stations = None

    # Check for -L flag
    if spec.endswith("-L"):
        show_labels = True
        spec = spec[:-2]

    # Split by + to separate instants and stations
    if "+" in spec:
        instants_str, stations_str = spec.split("+", 1)
        stations = list(map(int, stations_str.split(";")))
    else:
        instants_str = spec

    instants = list(map(int, instants_str.split(";")))

    return instants, stations, show_labels


def parse_station_days_spec(spec: str) -> Tuple[List[int], str]:
    """
    Parse station-days specification.

    Format: "est1;est2;...-days" where days can be "all" or "1;2;3"

    Args:
        spec: Specification string

    Returns:
        Tuple of (station_ids, days_str)
    """
    parts = spec.split("-")
    if len(parts) != 2:
        raise ValueError(f"Invalid station-days spec: {spec}")

    stations_str, days_str = parts
    station_ids = [int(s) for s in stations_str.split(";") if s.strip()]

    return station_ids, days_str


def parse_days_list(days_str: str, total_days: int) -> List[int]:
    """
    Parse days specification.

    Args:
        days_str: Days string ("all" or "1;2;3")
        total_days: Total number of days available

    Returns:
        List of day indices
    """
    if days_str == "all":
        return list(range(total_days))
    else:
        return list(map(int, days_str.split(";")))


def parse_video_spec(spec: str) -> Tuple[int, int, Optional[List[int]], str]:
    """
    Parse video specification.

    Format: "start:end[+est1;est2;...]" where end can be "end"

    Args:
        spec: Video specification

    Returns:
        Tuple of (start_instant, end_instant_or_none, stations, stations_text)
    """
    stations = None
    stations_text = "TODAS"

    if "+" in spec:
        moments, stations_str = spec.split("+", 1)
        stations = list(map(int, stations_str.split(";")))
        stations_text = str(stations)
    else:
        moments = spec

    start_str, end_str = moments.split(":")
    start_instant = int(start_str)

    if end_str == "end":
        end_instant = None  # Will be determined by matrix length
    else:
        end_instant = int(end_str)

    return start_instant, end_instant, stations, stations_text


def parse_displacement_spec(spec: str) -> Tuple[int, int, int, int, int]:
    """
    Parse displacement map specification.

    Format: "instant;deltaOrigin;deltaTransform;action;type"

    Args:
        spec: Displacement specification

    Returns:
        Tuple of (instant, delta_origin, delta_dest, action, type)
    """
    parts = spec.split(";")
    if len(parts) != 5:
        raise ValueError(
            f"Invalid displacement spec: {spec}. "
            "Expected: instant;deltaOrigin;deltaTransform;action;type"
        )

    try:
        instant = int(parts[0])
        delta_origin = int(parts[1])
        delta_dest = int(parts[2])
        action = int(parts[3])  # -1 = pickup, 1 = dropoff
        type_ = int(parts[4])  # 1 = real, 0 = fictitious
    except ValueError as e:
        raise ValueError(f"Non-integer values in displacement spec: {spec}") from e

    return instant, delta_origin, delta_dest, action, type_

def parse_int_list_from_text(text: str) -> list[int]:
    """Extracts all integers from text string"""
    return [int(x) for x in re.findall(r"\d+", text)]

