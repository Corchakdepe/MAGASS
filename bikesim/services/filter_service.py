"""Service for filtering operations."""

import logging
from pathlib import Path
from typing import List, Optional
import pandas as pd

from bikesim.core.models import FilterSpec, EstValorDiasFilter, HorasFilter
from bikesim.core.exceptions import InvalidFilterSpecError
from bikesim.repositories.result_repository import ResultRepository
from bikesim.utils.parsers import parse_operator
from Backend.Manipuladores.Filtrador import Filtrador

logger = logging.getLogger(__name__)


class FilterService:
    """Handles filtering operations on matrices."""

    def __init__(self, output_folder: Path, delta_time: int):
        """
        Initialize service.

        Args:
            output_folder: Folder for filter results
            delta_time: Time delta for the matrix
        """
        self.output_folder = output_folder
        self.delta_time = delta_time
        self.result_repo = ResultRepository(output_folder)

    def create_filtrador(self, matrix: pd.DataFrame) -> Filtrador:
        """
        Create Filtrador instance for matrix.

        Args:
            matrix: Matrix to filter

        Returns:
            Filtrador instance
        """
        return Filtrador(matrix, self.delta_time)

    def apply_station_value_filter(
        self,
        filtrador: Filtrador,
        operator_str: str,
        times: int,
        day_idx: int
    ) -> List[int]:
        """
        Filter stations exceeding value on a specific day.

        Args:
            filtrador: Filtrador instance
            operator_str: Operator string (e.g., ">=5.0")
            times: Number of times value must be exceeded
            day_idx: Day index

        Returns:
            List of station IDs
        """
        op_func, value, op_name = parse_operator(operator_str)

        stations = filtrador.consultarEstacionesSuperioresAUnValor(
            value,
            times,
            day_idx,
            operador=op_func
        )

        logger.info(
            f"Station value filter: found {len(stations)} stations "
            f"({op_name}{value}, {times} times, day {day_idx})"
        )

        return stations

    def apply_station_value_days_filter(
        self,
        filtrador: Filtrador,
        operator_str: str,
        times: int,
        days: List[int],
        exception_days: int = 0
    ) -> List[int]:
        """
        Filter stations exceeding value across multiple days.

        Args:
            filtrador: Filtrador instance
            operator_str: Operator string (e.g., ">=5.0")
            times: Number of times value must be exceeded per day
            days: List of day indices
            exception_days: Number of days allowed not to meet criteria

        Returns:
            List of station IDs
        """
        op_func, value, op_name = parse_operator(operator_str)

        stations = filtrador.consultarEstacionesSuperioresAUnValorEnVariosDias(
            value,
            times,
            days,
            diasPerdon=exception_days,
            operador=op_func
        )

        logger.info(
            f"Station value days filter: found {len(stations)} stations "
            f"({op_name}{value}, {times} times, {len(days)} days, "
            f"{exception_days} exception days)"
        )

        return stations

    def apply_hours_filter(
        self,
        filtrador: Filtrador,
        operator_str: str,
        station_percentage: float
    ) -> List[int]:
        """
        Filter hours where percentage of stations exceed value.

        Args:
            filtrador: Filtrador instance
            operator_str: Operator string
            station_percentage: Percentage of stations threshold

        Returns:
            List of hour indices
        """
        op_func, value, op_name = parse_operator(operator_str)

        hours = filtrador.consultarHorasEstacionesSuperioresAUnValor(
            value,
            station_percentage,
            operador=op_func
        )

        logger.info(
            f"Hours filter: found {len(hours)} hours "
            f"({op_name}{value}, {station_percentage}% stations)"
        )

        return hours

    def apply_percentage_filter(
        self,
        filtrador: Filtrador,
        operator_str: str,
        stations: List[int]
    ) -> float:
        """
        Calculate percentage of time stations exceed value.

        Args:
            filtrador: Filtrador instance
            operator_str: Operator string
            stations: List of station IDs

        Returns:
            Percentage value
        """
        op_func, value, op_name = parse_operator(operator_str)

        percentage = filtrador.consultarPorcentajeTiempoEstacionSuperiorAUnValor(
            value,
            stations,
            operador=op_func
        )

        logger.info(
            f"Percentage filter: {percentage:.2f}% of time "
            f"stations {stations} exceed {op_name}{value}"
        )

        return percentage

    def save_station_filter_result(
        self,
        stations: List[int],
        filename: str
    ) -> Path:
        """
        Save station filter results to CSV.

        Args:
            stations: List of station IDs
            filename: Output filename

        Returns:
            Path to saved file
        """
        file_path = self.output_folder / filename

        df = pd.DataFrame({"station_id": stations})
        df.to_csv(file_path, index=False)

        logger.info(f"Saved {len(stations)} stations to {file_path}")
        return file_path

    def save_hours_filter_result(
        self,
        hours: List[int],
        filename: str
    ) -> Path:
        """
        Save hours filter results to CSV.

        Args:
            hours: List of hour indices
            filename: Output filename

        Returns:
            Path to saved file
        """
        file_path = self.output_folder / filename

        df = pd.DataFrame({"t_index": hours})
        df.to_csv(file_path, index=False)

        logger.info(f"Saved {len(hours)} hours to {file_path}")
        return file_path

    def save_percentage_filter_result(
        self,
        percentage: float,
        filename: str
    ) -> Path:
        """
        Save percentage filter result to CSV.

        Args:
            percentage: Percentage value
            filename: Output filename

        Returns:
            Path to saved file
        """
        file_path = self.output_folder / filename

        df = pd.DataFrame({"percent": [percentage]})
        df.to_csv(file_path, index=False)

        logger.info(f"Saved percentage {percentage:.2f}% to {file_path}")
        return file_path

    def load_filter_stations(self, filename: Optional[str] = None) -> List[int]:
        """
        Load station IDs from filter result file.

        Args:
            filename: Filter filename (None for latest)

        Returns:
            List of station IDs
        """
        if filename:
            file_path = self.output_folder / filename
        else:
            file_path = self.result_repo.find_latest_filter_file()

        if not file_path or not file_path.exists():
            logger.warning("No filter file found")
            return []

        return self.result_repo.load_filter_stations(file_path)
