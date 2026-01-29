"""File system utilities."""

import re
from pathlib import Path
from datetime import datetime
from typing import Optional, List


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
