"""Chart generation service."""

import logging
import hashlib
from pathlib import Path
from datetime import datetime
from typing import List, Optional
import pandas as pd
import numpy as np

from bikesim.core.models import ChartMetadata, AnalysisArgs, StationDaySpec
from bikesim.core.exceptions import ChartGenerationError
from bikesim.utils.matrix_utils import (
    calculate_mean_by_hour,
    calculate_sum_by_hour,
    get_hour_indices,
    get_hour_index_list
)
from bikesim.utils.parsers import parse_station_days_spec, parse_days_list
from bikesim.config.constants import HOURS_PER_DAY
from Backend.Representacion.ChartBuilder import ChartBuilder

logger = logging.getLogger(__name__)


class ChartGenerator:
    """Generates chart outputs from matrix data."""

    def __init__(self, output_folder: Path, total_days: int, delta_time: int):
        """
        Initialize generator.

        Args:
            output_folder: Folder for chart outputs
            total_days: Total number of days in matrix
            delta_time: Time delta
        """
        self.output_folder = output_folder
        self.total_days = total_days
        self.delta_time = delta_time
        self.output_folder.mkdir(exist_ok=True, parents=True)

    def generate_all(
            self,
            matrix: pd.DataFrame,
            args: AnalysisArgs
    ) -> List[ChartMetadata]:
        """
        Generate all requested charts.

        Args:
            matrix: Data matrix
            args: Analysis arguments

        Returns:
            List of chart metadata
        """
        charts = []

        try:
            if args.graf_barras_est_med:
                charts.append(self.generate_station_mean_chart(
                    matrix, args.graf_barras_est_med
                ))

            if args.graf_barras_est_acum:
                charts.append(self.generate_station_cumulative_chart(
                    matrix, args.graf_barras_est_acum
                ))

            if args.graf_barras_dia:
                charts.append(self.generate_day_chart(
                    matrix, args.graf_barras_dia
                ))

            if args.graf_linea_comp_est:
                charts.append(self.generate_comparison_chart(
                    matrix, args.graf_linea_comp_est
                ))

            if args.graf_linea_comp_mats:
                charts.append(self.generate_matrix_comparison_chart(
                    matrix, args.graf_linea_comp_mats
                ))

        except Exception as e:
            logger.error(f"Error generating charts: {e}")
            raise ChartGenerationError(f"Chart generation failed: {e}") from e

        return charts

    def generate_station_mean_chart(
            self,
            matrix: pd.DataFrame,
            spec: str
    ) -> ChartMetadata:
        """
        Generate mean occupancy chart for stations.

        Args:
            matrix: Data matrix
            spec: Specification string "station1;station2-days"

        Returns:
            Chart metadata
        """
        station_ids, days_str = parse_station_days_spec(spec)
        days = parse_days_list(days_str, self.total_days)

        x_hours = list(range(HOURS_PER_DAY))
        series_data = {}

        for station_id in station_ids:
            series = calculate_mean_by_hour(matrix, days, station_id, HOURS_PER_DAY)
            series_data[f"est_{station_id}"] = series.tolist()

        # Generate unique ID
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = f"GraficaMedia_Estaciones_{'_'.join(map(str, station_ids))}"
        content_hash = hashlib.sha1(base_name.encode('utf-8')).hexdigest()[:8]
        json_filename = f"{timestamp}_Grafica_{content_hash}.json"
        json_path = self.output_folder / json_filename

        # Create chart using ChartBuilder
        chart_json = ChartBuilder.create_timeseries_chart(
            title=f"Mean Occupancy: Stations {station_ids}",
            x_hours=x_hours,
            series_data=series_data,
            stations=station_ids,
            days=days,
            aggregation="mean",
            output_path=str(json_path)
        )

        logger.info(f"Generated mean chart for stations {station_ids}")
        return ChartMetadata(**chart_json)

    def generate_station_cumulative_chart(
            self,
            matrix: pd.DataFrame,
            spec: str
    ) -> ChartMetadata:
        """
        Generate cumulative occupancy chart for stations.

        Args:
            matrix: Data matrix
            spec: Specification string

        Returns:
            Chart metadata
        """
        station_ids, days_str = parse_station_days_spec(spec)
        days = parse_days_list(days_str, self.total_days)

        x_hours = list(range(HOURS_PER_DAY))
        time_indices = get_hour_indices(days, HOURS_PER_DAY)
        hour_indices = get_hour_index_list(days, HOURS_PER_DAY)

        series_data = {}

        for station_id in station_ids:
            values = matrix.iloc[time_indices, station_id].values
            cumsum = (
                pd.Series(values)
                .groupby(hour_indices)
                .sum()
                .reindex(x_hours)
                .cumsum()
                .tolist()
            )
            series_data[f"est_{station_id}"] = cumsum

        # Generate unique ID
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = f"GraficaAcumulado_Estaciones_{'_'.join(map(str, station_ids))}"
        content_hash = hashlib.sha1(base_name.encode('utf-8')).hexdigest()[:8]
        json_filename = f"{timestamp}_Grafica_{content_hash}.json"
        json_path = self.output_folder / json_filename

        # Create chart
        chart_json = ChartBuilder.create_accumulation_chart(
            title=f"Cumulative Occupancy: Stations {station_ids}",
            x_hours=x_hours,
            series_data=series_data,
            stations=station_ids,
            days=days,
            output_path=str(json_path)
        )

        logger.info(f"Generated cumulative chart for stations {station_ids}")
        return ChartMetadata(**chart_json)

    def generate_day_chart(
            self,
            matrix: pd.DataFrame,
            spec: str
    ) -> ChartMetadata:
        """
        Generate day-based chart (distribution or station series).

        Args:
            matrix: Data matrix
            spec: Specification string "days-M/A[-Frec]"

        Returns:
            Chart metadata
        """
        parts = spec.split("-")
        if len(parts) < 2:
            raise ValueError(f"Invalid day chart spec: {spec}")

        days_str = parts[0]
        agg_type = parts[1]  # "M" or "A"
        is_frequency = len(parts) >= 3 and parts[2] == "Frec"

        is_mean = agg_type == "M"
        days = parse_days_list(days_str, self.total_days)

        # Calculate base values
        time_indices = get_hour_indices(days, HOURS_PER_DAY)

        if is_mean:
            base_vals = matrix.iloc[time_indices, :].mean(axis=0).to_numpy()
        else:
            base_vals = matrix.iloc[time_indices, :].sum(axis=0).to_numpy()

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        days_repr = "_".join(map(str, days[:5])) if len(days) <= 5 else f"all_{len(days)}"

        if is_frequency:
            # Distribution chart
            bin_count = 20
            vmin, vmax = float(base_vals.min()), float(base_vals.max())

            if vmin == vmax:
                vmin -= 0.5
                vmax += 0.5

            bins = np.linspace(vmin, vmax, bin_count + 1)
            counts, edges = np.histogram(base_vals, bins=bins)
            centers = (edges[:-1] + edges[1:]) / 2.0

            base_name = f"GraficaDias_{days_repr}_freq"
            content_hash = hashlib.sha1(base_name.encode('utf-8')).hexdigest()[:8]
            json_filename = f"{timestamp}_Grafica_{content_hash}.json"
            json_path = self.output_folder / json_filename

            chart_json = ChartBuilder.create_distribution_chart(
                title=f"Distribution - Days {days}",
                bin_centers=centers.tolist(),
                frequencies=counts.tolist(),
                days=days,
                value_type="mean" if is_mean else "sum",
                output_path=str(json_path)
            )
        else:
            # Station series chart
            x = list(range(len(base_vals)))
            vals = base_vals.tolist()

            base_name = f"GraficaDias_{days_repr}_stations"
            content_hash = hashlib.sha1(base_name.encode('utf-8')).hexdigest()[:8]
            json_filename = f"{timestamp}_Grafica_{content_hash}.json"
            json_path = self.output_folder / json_filename

            chart_json = ChartBuilder.create_station_series_chart(
                title=f"Station Values - Days {days}",
                station_indices=x,
                values=vals,
                days=days,
                value_type="mean" if is_mean else "sum",
                output_path=str(json_path)
            )

        logger.info(f"Generated day chart for days {days}")
        return ChartMetadata(**chart_json)

    def generate_comparison_chart(
            self,
            matrix: pd.DataFrame,
            specs: List[StationDaySpec]
    ) -> ChartMetadata:
        """
        Generate station comparison chart.

        Args:
            matrix: Data matrix
            specs: List of station-day specifications

        Returns:
            Chart metadata
        """
        stations = [spec.station_id for spec in specs]
        x_hours = list(range(HOURS_PER_DAY))

        series_specs = []

        for spec in specs:
            if spec.days == "all":
                days = list(range(self.total_days))
                days_label = "all"
            else:
                days = list(spec.days)
                days_label = days

            if not days:
                series = [None] * HOURS_PER_DAY
            else:
                series = calculate_mean_by_hour(
                    matrix, days, spec.station_id, HOURS_PER_DAY
                ).tolist()

            series_specs.append({
                "station_id": spec.station_id,
                "days": days_label,
                "values": series,
                "aggregation": "mean"
            })

        # Generate unique ID
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = f"GraficaCompararEstaciones_{'_'.join(map(str, stations[:5]))}"
        content_hash = hashlib.sha1(base_name.encode('utf-8')).hexdigest()[:8]
        json_filename = f"{timestamp}_Grafica_{content_hash}.json"
        json_path = self.output_folder / json_filename

        # Create chart
        chart_json = ChartBuilder.create_comparison_chart(
            title=f"Compare Stations {stations}",
            x_hours=x_hours,
            series_specs=series_specs,
            global_context={},
            output_path=str(json_path)
        )

        logger.info(f"Generated comparison chart for stations {stations}")
        return ChartMetadata(**chart_json)

    def generate_matrix_comparison_chart(
            self,
            matrix: pd.DataFrame,
            spec: str
    ) -> ChartMetadata:
        """
        Generate matrix comparison chart.

        Args:
            matrix: Current matrix
            spec: Specification string "delta;stations1;stations2;M/A"

        Returns:
            Chart metadata
        """
        from Backend import Constantes

        if Constantes.MATRIZ_CUSTOM is None:
            raise ChartGenerationError("MATRIZ_CUSTOM not available for comparison")

        parts = spec.split("-")
        if len(parts) != 4:
            raise ValueError(f"Invalid matrix comparison spec: {spec}")

        delta_matriz = int(parts[0])
        stations1 = list(map(int, parts[1].split(";")))
        stations2 = list(map(int, parts[2].split(";")))
        is_mean = parts[3] == "M"

        x_hours = list(range(HOURS_PER_DAY))

        # Calculate means by hour
        current_vals = matrix.mean(axis=0).tolist()
        custom_vals = Constantes.MATRIZ_CUSTOM.matrix.mean(axis=0).tolist()

        # Generate unique ID
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = "GraficaCompararMatrices"
        content_hash = hashlib.sha1(base_name.encode('utf-8')).hexdigest()[:8]
        json_filename = f"{timestamp}_Grafica_{content_hash}.json"
        json_path = self.output_folder / json_filename

        # Create chart
        chart_json = ChartBuilder.create_matrix_comparison_chart(
            title="Compare Matrices",
            x_hours=x_hours,
            current_values=current_vals,
            custom_values=custom_vals,
            delta=delta_matriz,
            is_mean=is_mean,
            stations1=stations1,
            stations2=stations2,
            output_path=str(json_path)
        )

        logger.info("Generated matrix comparison chart")
        return ChartMetadata(**chart_json)
