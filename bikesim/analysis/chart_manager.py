import logging
from pathlib import Path
from typing import List
import pandas as pd

from bikesim.core.models import AnalysisArgs, ChartMetadata
from bikesim.generators.chart_generator import ChartGenerator

logger = logging.getLogger(__name__)


class ChartManager:
    def __init__(self, output_folder: Path, total_days: int, delta_time: int):
        self.output_folder = output_folder
        self.total_days = total_days
        self.delta_time = delta_time
        self.generator = ChartGenerator(output_folder, total_days, delta_time)

    def generate_all_charts(
        self,
        matrix: pd.DataFrame,
        args: AnalysisArgs
    ) -> List[ChartMetadata]:
        charts = []

        try:
            if args.graf_barras_est_med:
                chart = self.generator.generate_station_mean_chart(
                    matrix,
                    args.graf_barras_est_med,
                    args.seleccion_agregacion
                )
                charts.append(chart)
                logger.info(f"Generated station mean chart: {chart.id}")

            if args.graf_barras_est_acum:
                chart = self.generator.generate_station_cumulative_chart(
                    matrix,
                    args.graf_barras_est_acum,
                    args.seleccion_agregacion
                )
                charts.append(chart)
                logger.info(f"Generated station cumulative chart: {chart.id}")

            if args.graf_barras_dia:
                chart = self.generator.generate_day_chart(
                    matrix,
                    args.graf_barras_dia,
                    args.seleccion_agregacion
                )
                charts.append(chart)
                logger.info(f"Generated day chart: {chart.id}")

            if args.graf_linea_comp_est:
                chart = self.generator.generate_comparison_chart(
                    matrix,
                    args.graf_linea_comp_est,
                    args.seleccion_agregacion
                )
                charts.append(chart)
                logger.info(f"Generated comparison chart: {chart.id}")

            if args.graf_linea_comp_mats:
                chart = self.generator.generate_matrix_comparison_chart(
                    matrix,
                    args.graf_linea_comp_mats,
                    args.seleccion_agregacion
                )
                charts.append(chart)
                logger.info(f"Generated matrix comparison chart: {chart.id}")

        except Exception as e:
            logger.error(f"Error generating charts: {e}", exc_info=True)

        logger.info(f"Generated {len(charts)} charts total")
        return charts
