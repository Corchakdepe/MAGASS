from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import List, Optional, Tuple

import json

from Backend import Constantes


def _sync_html_name_with_png(nombrePNG: str, logical: str) -> None:
    """
    Find any HTML in RUTA_SALIDA whose name contains `logical` and
    rename the latest one so it shares the timestamp prefix of nombrePNG.
    """
    try:
        out_dir = Path(Constantes.RUTA_SALIDA)
        candidates = sorted(out_dir.glob(f"*{logical}*.html"))
        if not candidates:
            return

        original_html = candidates[-1]  # latest for that logical name
        target_html_name = Path(nombrePNG).with_suffix(".html").name
        target_html_path = out_dir / target_html_name

        if original_html != target_html_path:
            original_html.rename(target_html_path)
    except Exception:
        # keep analysis running even if the rename fails
        pass


def parse_mapa_spec(spec: str) -> Tuple[List[int], Optional[List[int]], bool]:
    """
    spec: "0;10;20+1;15;26-L" o "0;1;2" o "0;1;2-L" o "0;1;2+3;4"
    return: (instantes, estaciones or None, labels_abiertos)
    """
    if not spec:
        return [], None, False

    labels = False
    if spec.endswith("-L"):
        labels = True
        spec = spec[:-2]

    if "+" in spec:
        inst_str, est_str = spec.split("+", 1)
        estaciones = [int(x) for x in est_str.split(";") if x.strip()]
    else:
        inst_str = spec
        estaciones = None

    instantes = [int(x) for x in inst_str.split(";") if x.strip()]
    return instantes, estaciones, labels


def write_map_sidecar(
    base_html_or_png: str,
    *,
    name: str,
    matrix_spec: Optional[str],
    delta: Optional[int],
    instante: Optional[int],
    kind: str,
) -> None:
    """
    Create a JSON sidecar with metadata for a given map.

    base_html_or_png: filename used for the map (html or png) in Constantes.RUTA_SALIDA.
    """
    base_path = Path(Constantes.RUTA_SALIDA) / base_html_or_png
    json_path = base_path.with_suffix(".json")
    meta = {
        "name": name,
        "matrix": matrix_spec,
        "delta": delta,
        "instante": instante,
        "kind": kind,
        "created_at": datetime.now().isoformat(timespec="seconds"),
    }
    json_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
