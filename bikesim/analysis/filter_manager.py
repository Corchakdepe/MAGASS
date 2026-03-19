"""Filter application and management."""

import logging
from pathlib import Path
from typing import List, Optional
import pandas as pd

from bikesim.core.models import AnalysisArgs, FilterResult
from bikesim.services.filter_service import FilterService
from bikesim.generators.filter_generator import FilterGenerator

logger = logging.getLogger(__name__)


class FilterManager:
    """Manages filter application workflow."""

    def __init__(self, output_folder: Path, delta_time: int, total_days: int):
        """
        Initialize manager.

        Args:
            output_folder: Output folder for filter results
            delta_time: Time delta in minutes
            total_days: Total number of days
        """
        self.output_folder = output_folder
        self.delta_time = delta_time
        self.total_days = total_days
        self.filter_service = FilterService(output_folder, delta_time)

    def apply_all_filters(
            self,
            matrix: pd.DataFrame,
            args: AnalysisArgs
    ) -> List[FilterResult]:
        """
        Apply all specified filters.

        Args:
            matrix: Data matrix
            args: Analysis arguments

        Returns:
            List of filter results
        """
        generator = FilterGenerator(self.filter_service, matrix)
        results = generator.generate_all(args)

        logger.info(f"Applied {len(results)} filters")
        return results

    def load_filter_result(
            self,
            filename: Optional[str] = None
    ) -> List[int]:
        """
        Load stations from filter result file.

        Args:
            filename: Filter filename (None for latest)

        Returns:
            List of station IDs
        """
        stations = self.filter_service.load_filter_stations(filename)
        logger.info(f"Loaded {len(stations)} stations from filter result")
        return stations
