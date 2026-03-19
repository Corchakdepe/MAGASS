"""File system utilities."""
import logging
import re
from pathlib import Path
from datetime import datetime
from typing import Optional, List

from bikesim import Constantes
from bikesim.config.settings import RESULTS_BASE_FOLDER
from bikesim.utils.historymanagement import append_simulation_metadata


def create_timestamp() -> str:
    """Generate timestamp string for file naming."""
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def format_filename(base_name: str, extension: str) -> str:
    """
    Format filename with timestamp.

    Args:
        base_name: Base name without extension
        extension: File extension (with or without dot)

    Returns:
        Formatted filename
    """
    if not extension.startswith("."):
        extension = f".{extension}"

    timestamp = create_timestamp()
    return f"{timestamp}_{base_name}{extension}"


def parse_int_list_from_text(text: str) -> List[int]:
    """
    Extract all integers from text string.

    Args:
        text: Input text

    Returns:
        List of integers found in text
    """
    return [int(x) for x in re.findall(r"\d+", text)]


def find_latest_file(directory: Path, pattern: str) -> Optional[Path]:
    """
    Find most recent file matching pattern.

    Args:
        directory: Directory to search
        pattern: Glob pattern

    Returns:
        Most recent file or None
    """
    files = list(directory.glob(pattern))
    if not files:
        return None
    return max(files, key=lambda f: f.stat().st_mtime)


def load_text_file(path: Path) -> str:
    """
    Load text file content.

    Args:
        path: File path

    Returns:
        File content
    """
    return path.read_text(encoding="utf-8").strip()


def normalize_separators(text: str, target: str = ";") -> str:
    """
    Normalize separators in text.

    Args:
        text: Input text
        target: Target separator

    Returns:
        Text with normalized separators
    """
    return text.replace(",", target).replace("\r", target).replace("\n", target)

def _n() -> str:
    """Returns null character from constants"""
    return getattr(Constantes, "CARACTER_NULO_CMD", "_")


def find_run_folder(run: str = None) -> Optional[Path]:
    """Finds simulation folder by name or returns latest"""
    if run:
        folder = RESULTS_BASE_FOLDER / run
        return folder if folder.exists() else None
    else:
        return get_latest_simulation_folder()


def get_latest_simulation_folder() -> Optional[Path]:
    """Returns most recently modified simulation folder"""
    folders = [f for f in RESULTS_BASE_FOLDER.glob("*_sim_*") if f.is_dir()]

    if not folders:
        return None

    latest = max(folders, key=lambda x: x.stat().st_mtime)
    logging.info(f"Latest simulation folder: {latest}")
    return latest


def create_simulation_folder(
        stress_type: int,
        stress: float,
        walk_cost: float,
        delta: int,
        simname: Optional[str] = None,
        cityname: Optional[str] = None,
        number_of_stations: Optional[int] = None,
        number_of_bikes: Optional[int] = None,
        simdata: Optional[dict] = None,
) -> Path:
    """Creates new simulation output folder with metadata"""
    timestamp = create_timestamp()
    folder_name = f"{timestamp}_sim_ST{stress_type}_S{stress:.2f}_WC{walk_cost:.2f}_D{delta}"
    output_folder = RESULTS_BASE_FOLDER / folder_name
    output_folder.mkdir(parents=True, exist_ok=True)

    logging.info(f"Created simulation output folder: {output_folder}")

    # Save metadata to history
    append_simulation_metadata(
        simname=simname or folder_name,
        simfolder=folder_name,
        cityname=cityname,
        number_of_stations=number_of_stations,
        number_of_bikes=number_of_bikes,
        simdata=simdata,
    )

    return output_folder