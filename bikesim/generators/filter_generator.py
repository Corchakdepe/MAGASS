"""Filter result generation service."""

import logging
from typing import List
import pandas as pd

from bikesim.core.models import FilterResult, AnalysisArgs
from bikesim.services.filter_service import FilterService
from bikesim.utils.parsers import parse_days_list
from bikesim.auxiliares import auxiliar_ficheros

logger = logging.getLogger(__name__)


class FilterGenerator:
    """Generates filter results."""

    def __init__(self, filter_service: FilterService, matrix: pd.DataFrame):
        """
        Initialize generator.

        Args:
            filter_service: Filter service instance
            matrix: Data matrix
        """
        self.filter_service = filter_service
        self.matrix = matrix
        self.filtrador = filter_service.create_filtrador(matrix)
        self.total_days = matrix.shape[0] // 24

    def generate_all(self, args: AnalysisArgs) -> List[FilterResult]:
        """
        Generate all requested filter results.

        Args:
            args: Analysis arguments

        Returns:
            List of filter results
        """
        results = []

        # Auto-map filtro/tipo_filtro to specific filter fields
        if args.filtro and args.tipo_filtro and args.filtro != "_":
            self._map_filter_to_fields(args)

        try:
            if args.filtrado_EstValor and args.filtrado_EstValor != "_":
                results.append(self.generate_station_value_filter(args.filtrado_EstValor))

            if args.filtrado_EstValorDias and args.filtrado_EstValorDias != "_":
                results.append(self.generate_station_value_days_filter(args.filtrado_EstValorDias))

            if args.filtrado_Horas and args.filtrado_Horas != "_":
                results.append(self.generate_hours_filter(args.filtrado_Horas))

            if args.filtrado_PorcentajeEstaciones and args.filtrado_PorcentajeEstaciones != "_":
                results.append(self.generate_percentage_filter(args.filtrado_PorcentajeEstaciones))

        except Exception as e:
            logger.error(f"Error generating filters: {e}")

        return results

    def _map_filter_to_fields(self, args: AnalysisArgs) -> None:
        """Map generic filtro/tipo_filtro to specific filter fields."""
        filter_type = args.tipo_filtro

        if filter_type in ("EstValor", "EstValorDias"):
            args.filtrado_EstValorDias = args.filtro
        elif filter_type == "Horas":
            args.filtrado_Horas = args.filtro
        elif filter_type == "Porcentaje":
            args.filtrado_PorcentajeEstaciones = args.filtro

    def generate_station_value_filter(self, spec: str) -> FilterResult:
        """
        Generate station value filter (single day).

        Args:
            spec: Filter spec "operatorValue;times;day_idx"

        Returns:
            Filter result
        """
        parts = spec.split(";")
        if len(parts) != 3:
            raise ValueError(f"Invalid EstValor spec: {spec}")

        operator_str = parts[0]
        times = int(parts[1])
        day_idx = int(parts[2])

        stations = self.filter_service.apply_station_value_filter(
            self.filtrador,
            operator_str,
            times,
            day_idx
        )

        # Generate filename
        from bikesim.utils.parsers import parse_operator
        _, value, op_name = parse_operator(operator_str)

        filename = auxiliar_ficheros.formatoArchivo(
            f"Filtrado_Estaciones{op_name}Valor_DIA{day_idx}_{op_name}{value}_{times}",
            "csv"
        )

        file_path = self.filter_service.save_station_filter_result(stations, filename)

        return FilterResult(
            filter_type="EstValor",
            stations=stations,
            file_path=str(file_path)
        )

    def generate_station_value_days_filter(self, spec: str) -> FilterResult:
        """
        Generate station value filter (multiple days).

        Args:
            spec: Filter spec "operatorValue;times;days;exception_days"

        Returns:
            Filter result
        """
        parts = spec.split(";")
        if len(parts) != 4:
            raise ValueError(f"Invalid EstValorDias spec: {spec}")

        operator_str = parts[0]
        times = int(parts[1])
        days_str = parts[2]
        exception_days = int(parts[3])

        days = parse_days_list(days_str, self.total_days)

        stations = self.filter_service.apply_station_value_days_filter(
            self.filtrador,
            operator_str,
            times,
            days,
            exception_days
        )

        # Generate filename
        from bikesim.utils.parsers import parse_operator
        _, value, op_name = parse_operator(operator_str)

        days_repr = '-'.join(map(str, days)) if len(days) <= 10 else f"all_{len(days)}"
        filename = auxiliar_ficheros.formatoArchivo(
            f"Filtrado_Estaciones{op_name}Valor_MES_{op_name}{value}_{times}_{days_repr}_{exception_days}",
            "csv"
        )

        file_path = self.filter_service.save_station_filter_result(stations, filename)

        return FilterResult(
            filter_type="EstValorDias",
            stations=stations,
            file_path=str(file_path)
        )

    def generate_hours_filter(self, spec: str) -> FilterResult:
        """
        Generate hours filter.

        Args:
            spec: Filter spec "operatorValue;station_percentage"

        Returns:
            Filter result
        """
        parts = spec.split(";")
        if len(parts) != 2:
            raise ValueError(f"Invalid Horas spec: {spec}")

        operator_str = parts[0]
        station_percentage = float(parts[1])

        hours = self.filter_service.apply_hours_filter(
            self.filtrador,
            operator_str,
            station_percentage
        )

        # Generate filename
        from bikesim.utils.parsers import parse_operator
        _, value, op_name = parse_operator(operator_str)

        filename = auxiliar_ficheros.formatoArchivo(
            f"Filtrado_Horas{op_name}Valor_{op_name}{value}_{station_percentage}",
            "csv"
        )

        file_path = self.filter_service.save_hours_filter_result(hours, filename)

        return FilterResult(
            filter_type="Horas",
            hours=hours,
            file_path=str(file_path)
        )

    def generate_percentage_filter(self, spec: str) -> FilterResult:
        """
        Generate percentage filter.

        Args:
            spec: Filter spec "operatorValue-station1;station2;..."

        Returns:
            Filter result
        """
        parts = spec.split("-")
        if len(parts) != 2:
            raise ValueError(f"Invalid Porcentaje spec: {spec}")

        operator_str = parts[0]
        stations = list(map(int, parts[1].split(";")))

        percentage = self.filter_service.apply_percentage_filter(
            self.filtrador,
            operator_str,
            stations
        )

        # Generate filename
        from bikesim.utils.parsers import parse_operator
        _, value, op_name = parse_operator(operator_str)

        stations_repr = '-'.join(map(str, stations)) if len(stations) <= 10 else f"{len(stations)}_stations"
        filename = auxiliar_ficheros.formatoArchivo(
            f"Filtrado_PorcentajeEstaciones{op_name}Valor_{op_name}{value}_{stations_repr}",
            "csv"
        )

        file_path = self.filter_service.save_percentage_filter_result(percentage, filename)

        return FilterResult(
            filter_type="PorcentajeEstaciones",
            percentage=percentage,
            file_path=str(file_path)
        )
