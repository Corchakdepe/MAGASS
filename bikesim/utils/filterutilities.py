from datetime import datetime
from http.client import HTTPException
from pathlib import Path
import re
import logging
from typing import List

logger = logging.getLogger(__name__)


def load_stations_from_file(path: Path) -> list[int]:
    """Loads station IDs from filter result file"""
    try:
        text = path.read_text(encoding="utf-8").strip()
        logger.debug(f"Loading stations from {path}, content: {text[:200]}...")

        if not text:
            logger.warning(f"Filter file {path} is empty")
            return []

        stations: list[int] = []

        # Method 1: Try to parse as Python list format [1, 2, 3, 4]
        if text.startswith('[') and text.endswith(']'):
            try:
                import ast
                parsed = ast.literal_eval(text)
                if isinstance(parsed, list):
                    stations = [int(x) for x in parsed if str(x).lstrip('-').isdigit()]
                    if stations:
                        logger.info(f"Parsed {len(stations)} stations from list format")
                        return stations
            except:
                pass

        # Method 2: Try comma-separated values
        if ',' in text:
            parts = text.split(',')
            for part in parts:
                part = part.strip()
                if part and (part.lstrip('-').isdigit() or part.replace('.', '').isdigit()):
                    try:
                        stations.append(int(float(part)))
                    except:
                        pass
            if stations:
                logger.info(f"Parsed {len(stations)} stations from comma-separated format")
                return stations

        # Method 3: Try semicolon-separated values
        if ';' in text:
            parts = text.split(';')
            for part in parts:
                part = part.strip()
                if part and (part.lstrip('-').isdigit() or part.replace('.', '').isdigit()):
                    try:
                        stations.append(int(float(part)))
                    except:
                        pass
            if stations:
                logger.info(f"Parsed {len(stations)} stations from semicolon-separated format")
                return stations

        # Method 4: Try space-separated values
        if ' ' in text:
            parts = text.split()
            for part in parts:
                part = part.strip()
                if part and (part.lstrip('-').isdigit() or part.replace('.', '').isdigit()):
                    try:
                        stations.append(int(float(part)))
                    except:
                        pass
            if stations:
                logger.info(f"Parsed {len(stations)} stations from space-separated format")
                return stations

        # Method 5: Try one per line
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if line and not line.startswith('#'):
                # Try to extract numbers from the line
                numbers = re.findall(r'-?\d+', line)
                for num in numbers:
                    try:
                        stations.append(int(num))
                    except:
                        pass

        if stations:
            logger.info(f"Parsed {len(stations)} stations from line-by-line format")
        else:
            logger.warning(f"No stations found in {path}")

        # Remove duplicates and sort
        stations = sorted(list(set(stations)))
        return stations

    except Exception as e:
        logger.error(f"Error loading stations from {path}: {e}")
        return []


def find_last_filter_file(output_folder: str) -> Path:
    """Finds most recent filter result file in output folder"""
    out_dir = Path(output_folder)

    if not out_dir.exists():
        logger.error(f"Output folder does not exist: {output_folder}")
        raise HTTPException(
            status_code=400,
            detail=f"La carpeta de salida no existe: {output_folder}"
        )

    # Possible filter file patterns
    patterns = [
        "*Filtrado_Estaciones*.csv",
        "*Filtrado_Estaciones*.txt",
        "*Filtrado_Horas*.csv",
        "*Filtrado_Horas*.txt",
        "*Filtrado_PorcentajeEstaciones*.csv",
        "*Filtrado_PorcentajeEstaciones*.txt",
        "*filter*.csv",  # Additional patterns
        "*filter*.txt",
        "*stations*.csv",
        "*stations*.txt",
    ]

    candidates: list[Path] = []
    for pat in patterns:
        candidates.extend(out_dir.glob(pat))

    # Also check for files that might have been generated with timestamp
    all_files = list(out_dir.glob("*"))
    for f in all_files:
        if f.is_file() and ("Filtrado" in f.name or "filter" in f.name.lower()):
            if f not in candidates:
                candidates.append(f)

    if not candidates:
        logger.error(f"No filter files found in {output_folder}")
        raise HTTPException(
            status_code=400,
            detail="No se encontraron archivos de filtro en la carpeta de salida"
        )

    # Return most recent by modification time
    latest = sorted(candidates, key=lambda p: p.stat().st_mtime, reverse=True)[0]
    logger.info(f"Found latest filter file: {latest}")
    return latest


# When saving filter results, use a clear format
def save_filter_result(self, stations: List[int], filter_type: str):
    """Save filter result to file"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"Filtrado_Estaciones_{timestamp}.txt"
    filepath = self.output_folder / filename

    # Save as comma-separated values (easy to parse)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(','.join(str(s) for s in stations))

    logger.info(f"Saved filter result with {len(stations)} stations to {filepath}")
    return filepath