from http.client import HTTPException
from pathlib import Path


def _load_stations_from_file(path: Path) -> list[int]:
    """Loads station IDs from filter result file"""
    text = path.read_text(encoding="utf-8")

    # Normalize separators: convert commas and newlines to semicolons
    text = text.replace(",", ";").replace("\r", ";").replace("\n", ";")
    tokens = [t.strip() for t in text.split(";") if t.strip()]

    stations: list[int] = []
    for t in tokens:
        if t.isdigit():
            stations.append(int(t))

    return stations


def _find_last_filter_file(output_folder: str) -> Path:
    """Finds most recent filter result file in output folder"""
    out_dir = Path(output_folder)

    # Possible filter file patterns
    patterns = [
        "*Filtrado_Estaciones*.csv",
        "*Filtrado_Estaciones*.txt",
        "*Filtrado_Horas*.csv",
        "*Filtrado_Horas*.txt",
        "*Filtrado_PorcentajeEstaciones*.csv",
        "*Filtrado_PorcentajeEstaciones*.txt",
    ]

    candidates: list[Path] = []
    for pat in patterns:
        candidates.extend(out_dir.glob(pat))

    if not candidates:
        raise HTTPException(
            status_code=400,
            detail="El filtro no devolvió estaciones para los mapas"
        )

    # Return most recent by modification time
    return sorted(candidates, key=lambda p: p.stat().st_mtime)[-1]

