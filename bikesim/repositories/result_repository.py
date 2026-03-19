"""Repository for analysis results."""

import logging
from pathlib import Path
from typing import List, Optional
import json

from bikesim.core.models import ChartMetadata, MapMetadata, FilterResult
from bikesim.core.exceptions import FileOperationError
from bikesim.config.constants import MAP_KINDS

logger = logging.getLogger(__name__)


class ResultRepository:
    """Handles storage and retrieval of analysis results."""

    def __init__(self, output_folder: Path):
        """
        Initialize repository.

        Args:
            output_folder: Folder for result files
        """
        self.output_folder = output_folder
        self.output_folder.mkdir(exist_ok=True, parents=True)

    def save_chart_json(self, chart: ChartMetadata) -> Path:
        """
        Save chart metadata to JSON file.

        Args:
            chart: Chart metadata

        Returns:
            Path to saved file
        """
        try:
            if chart.file_path:
                file_path = Path(chart.file_path)
            else:
                file_path = self.output_folder / f"{chart.id}.json"

            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(chart.dict(), f, ensure_ascii=False, indent=2)

            logger.info(f"Saved chart JSON to {file_path}")
            return file_path
        except Exception as e:
            logger.error(f"Failed to save chart JSON: {e}")
            raise FileOperationError(f"Could not save chart: {e}") from e

    def list_maps(
            self,
            kind: Optional[str] = None,
            format: Optional[str] = None
    ) -> List[Path]:
        """
        List map files in output folder.

        Args:
            kind: Filter by map kind (density, circle, etc.)
            format: Filter by format (html, png)

        Returns:
            List of map file paths
        """
        files = []

        for prefix, _, fmt in MAP_KINDS:
            if kind and prefix.lower() != f"mapa{kind.lower()}":
                continue
            if format and fmt != format:
                continue

            pattern = f"*{prefix}*.{fmt}"
            files.extend(self.output_folder.glob(pattern))

        return sorted(files, key=lambda f: f.stat().st_mtime, reverse=True)

    def list_charts(self) -> List[Path]:
        """
        List chart JSON files in output folder.

        Returns:
            List of chart file paths
        """
        files = list(self.output_folder.glob("*Grafica*.json"))
        return sorted(files, key=lambda f: f.stat().st_mtime, reverse=True)

    def list_filters(self) -> List[Path]:
        """
        List filter result files in output folder.

        Returns:
            List of filter file paths
        """
        patterns = [
            "*Filtrado_Estaciones*.csv",
            "*Filtrado_Horas*.csv",
            "*Filtrado_PorcentajeEstaciones*.csv"
        ]

        files = []
        for pattern in patterns:
            files.extend(self.output_folder.glob(pattern))

        return sorted(files, key=lambda f: f.stat().st_mtime, reverse=True)

    def find_latest_filter_file(self) -> Optional[Path]:
        """
        Find most recent filter result file.

        Returns:
            Path to latest filter file or None
        """
        files = self.list_filters()
        return files[0] if files else None

    def load_filter_stations(self, file_path: Path) -> List[int]:
        """
        Load station IDs from filter result file.

        Args:
            file_path: Path to filter file

        Returns:
            List of station IDs
        """
        from bikesim.utils.file_utils import load_text_file, normalize_separators

        try:
            text = load_text_file(file_path)
            text = normalize_separators(text, ";")

            tokens = [t.strip() for t in text.split(";") if t.strip()]
            stations = [int(t) for t in tokens if t.isdigit()]

            logger.info(f"Loaded {len(stations)} stations from {file_path}")
            return stations
        except Exception as e:
            logger.error(f"Failed to load filter stations: {e}")
            return []
