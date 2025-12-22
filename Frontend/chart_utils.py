from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any, Dict, List

import pandas as pd


def write_series_csv(base: str, x: List[Any], ys: Dict[str, List[Any]], meta: Dict[str, Any]) -> Path:
    base_path = Path(base)
    parent = base_path.parent
    original_name = base_path.name

    short_root = "Grafica"
    if "Grafica" in original_name:
        prefix = original_name.split("Grafica", 1)[0] + "Grafica"
    else:
        prefix = original_name[:40]

    h = hashlib.sha1(original_name.encode("utf-8")).hexdigest()[:8]
    safe_name = f"{prefix}_{h}.csv"
    out_path = parent / safe_name

    data = {"x": x}
    for name, values in ys.items():
        data[name] = values

    df = pd.DataFrame(data)
    df.to_csv(out_path, index=False)
    return out_path
