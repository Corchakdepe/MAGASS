"""Utility functions for map generation."""

import json
from pathlib import Path
from typing import Tuple, List, Optional


def parse_mapa_spec(spec: str) -> Tuple[List[int], Optional[List[int]], bool]:
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


def write_map_sidecar(
        map_path: Path,
        instant: int,
        stations: Optional[List[int]] = None,
        map_type: str = "unknown"
):
    """
    Write sidecar JSON file for map metadata.

    Args:
        map_path: Path to map HTML/PNG file
        instant: Time instant
        stations: Station IDs (optional)
        map_type: Type of map
    """
    json_path = map_path.with_suffix('.json')

    metadata = {
        "map_type": map_type,
        "instant": instant,
        "stations": stations,
        "html_file": map_path.name
    }

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)


def _sync_html_name_with_png(html_name: str) -> str:
    """
    Ensure HTML filename matches PNG naming convention.

    Args:
        html_name: HTML filename

    Returns:
        Standardized filename
    """
    return html_name.replace('.png', '.html')
