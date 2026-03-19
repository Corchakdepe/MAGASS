import json
from pathlib import Path
from typing import Tuple, List, Optional


def parse_mapa_spec(spec: str) -> Tuple[List[int], Optional[List[int]], bool]:
    show_labels = False
    stations = None

    if spec.endswith("-L"):
        show_labels = True
        spec = spec[:-2]

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
    json_path = map_path.with_suffix(".json")

    metadata = {
        "map_type": map_type,
        "instant": instant,
        "stations": stations,
        "html_file": map_path.name
    }

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)


def _sync_html_name_with_png(html_name: str) -> str:
    return html_name.replace(".png", ".html")
