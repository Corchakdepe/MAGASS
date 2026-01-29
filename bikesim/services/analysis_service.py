"""Service for analysis orchestration."""

import logging
from pathlib import Path
from typing import Dict, List, Optional
import pandas as pd
from bikesim.generators.filter_generator import FilterGenerator
from bikesim.core.models import AnalysisArgs, AnalysisResult, StationDaySpec
from bikesim.core.exceptions import DataLoadError, InvalidDeltaTransformationError
from bikesim.repositories.matrix_repository import MatrixRepository
from bikesim.services.filter_service import FilterService
from bikesim.generators.chart_generator import ChartGenerator
from bikesim.generators.map_generator import MapGenerator
from bikesim.config.settings import AppConfig
from bikesim.config.constants import HOURS_PER_DAY

from Backend import Constantes
from Backend.Manipuladores import Agrupador
from Backend.Auxiliares import auxiliaresCalculos

logger = logging.getLogger(__name__)


class AnalysisService:
    """Orchestrates analysis workflow."""

    def __init__(self, config: AppConfig):
        """
        Initialize service.

        Args:
            config: Application configuration
        """
        self.config = config
        self.matrix_repo = MatrixRepository(config.results_folder)

    def run_analysis(self, args: AnalysisArgs) -> AnalysisResult:
        """
        Execute complete analysis workflow.

        Args:
            args: Analysis arguments

        Returns:
            Analysis results
        """
        logger.info(f"Starting analysis: {args.input_folder} -> {args.output_folder}")

        # Load matrices
        matrices, summary = self._load_matrices(args.input_folder)

        # Set global constants from summary
        self._set_constants(summary, args.output_folder)

        # Select and aggregate matrices
        matrix = self._select_and_aggregate_matrices(matrices, args.seleccion_agregacion)

        # Apply delta transformations
        matrix = self._apply_delta_transformations(matrix, args)

        # Calculate total days
        total_days = matrix.shape[0] // HOURS_PER_DAY

        # Save desired matrix
        self._save_desired_matrix(matrix, args.output_folder)

        # Initialize generators
        chart_gen = ChartGenerator(
            Path(args.output_folder),
            total_days,
            int(Constantes.DELTA_TIME)
        )

        map_gen = MapGenerator(
            Path(args.output_folder),
            Constantes.COORDENADAS
        )

        filter_service = FilterService(
            Path(args.output_folder),
            int(Constantes.DELTA_TIME)
        )

        # Create result container
        result = AnalysisResult(output_folder=args.output_folder)

        # Apply filters if specified
        if self._should_apply_filters(args):
            result.filters = self._apply_filters(matrix, args, filter_service)

        # Handle filter-based map/graph generation
        if args.use_filter_for_maps:
            result = self._apply_filter_for_maps(result, args, matrix, chart_gen, map_gen, filter_service)
            return result

        if args.use_filter_for_graphs:
            result = self._apply_filter_for_graphs(result, args, matrix, chart_gen, filter_service)
            return result

        # Generate charts
        result.charts = self._generate_charts(matrix, args, chart_gen)

        # Generate maps
        result.maps = self._generate_maps(matrix, args, map_gen)

        logger.info(
            f"Analysis complete: {len(result.charts)} charts, "
            f"{len(result.maps)} maps, {len(result.filters)} filters"
        )

        return result

    def _load_matrices(self, input_folder: str) -> tuple:
        """Load matrices from input folder."""
        return self.matrix_repo.load_from_folder(input_folder)

    def _set_constants(self, summary: list, output_folder: str) -> None:
        """Set global constants from summary."""
        Constantes.DELTA_TIME = float(summary[0])
        Constantes.PORCENTAJE_ESTRES = float(summary[1])
        Constantes.COSTE_ANDAR = float(summary[2])
        Constantes.RUTA_SALIDA = output_folder

    def _select_and_aggregate_matrices(
            self,
            matrices: Dict,
            selection_spec: str
    ) -> pd.DataFrame:
        """
        Select and aggregate matrices based on specification.

        Args:
            matrices: Dictionary of available matrices
            selection_spec: Selection specification string

        Returns:
            Aggregated matrix
        """
        operation = 1  # 1 = add, -1 = subtract

        # Check for subtraction operation
        if "(-)" in selection_spec:
            selection_spec = selection_spec.split(")")[1]
            operation = -1

        # Parse matrix IDs
        matrix_ids = list(map(int, selection_spec.split(";")))
        lista_matrices = Constantes.LISTA_MATRICES

        # Start with first matrix
        if Constantes.MATRIZ_CUSTOM is None or -1 not in matrix_ids:
            desired_matrix = matrices[lista_matrices[matrix_ids[0]]].matrix.copy()
            start_idx = 1
        else:
            desired_matrix = Constantes.MATRIZ_CUSTOM.matrix.copy()
            start_idx = 0

        # Aggregate remaining matrices
        if len(matrix_ids) > 1:
            for i in range(start_idx, len(matrix_ids)):
                if matrix_ids[i] != -1:
                    matrix_to_add = matrices[lista_matrices[matrix_ids[i]]].matrix

                    if operation == 1:
                        desired_matrix = Agrupador.agruparMatrices(
                            desired_matrix,
                            matrix_to_add
                        )
                    else:
                        desired_matrix = Agrupador.sustraerMatrices(
                            desired_matrix,
                            matrix_to_add
                        )

        # Fill missing rows
        target_rows = matrices[Constantes.OCUPACION].matrix.shape[0] - 1
        desired_matrix = auxiliaresCalculos.rellenarFilasMatrizDeseada(
            desired_matrix,
            target_rows
        )

        logger.info(f"Selected and aggregated matrices: shape {desired_matrix.shape}")
        return desired_matrix

    def _apply_delta_transformations(
            self,
            matrix: pd.DataFrame,
            args: AnalysisArgs
    ) -> pd.DataFrame:
        """
        Apply delta time transformations.

        Args:
            matrix: Input matrix
            args: Analysis arguments

        Returns:
            Transformed matrix
        """
        current_delta = Constantes.DELTA_TIME

        # Apply mean aggregation
        if args.delta_media is not None:
            logger.info(f"Applying delta mean: {current_delta} -> {args.delta_media}")
            matrix = Agrupador.colapsarDeltasMedia(
                matrix,
                current_delta,
                args.delta_media
            )
            Constantes.DELTA_TIME = int(args.delta_media)
            current_delta = args.delta_media

        # Apply accumulation aggregation
        if args.delta_acumulada is not None:
            logger.info(f"Applying delta accumulation: {current_delta} -> {args.delta_acumulada}")
            matrix = Agrupador.colapsarDeltasAcumulacion(
                matrix,
                current_delta,
                args.delta_acumulada
            )
            Constantes.DELTA_TIME = int(args.delta_acumulada)

        return matrix

    def _save_desired_matrix(self, matrix: pd.DataFrame, output_folder: str) -> None:
        """Save the desired matrix to output folder."""
        from Backend.Auxiliares import auxiliar_ficheros

        filename = auxiliar_ficheros.formatoArchivo("ficheroMatrizDeseada", "csv")
        file_path = Path(output_folder) / filename
        matrix.to_csv(file_path, index=False)
        logger.info(f"Saved desired matrix to {file_path}")

    def _should_apply_filters(self, args: AnalysisArgs) -> bool:
        """Check if any filters are specified."""
        return any([
            args.filtrado_EstValor,
            args.filtrado_EstValorDias,
            args.filtrado_Horas,
            args.filtrado_PorcentajeEstaciones,
            args.filtro and args.tipo_filtro
        ])

    def _apply_filters(
            self,
            matrix: pd.DataFrame,
            args: AnalysisArgs,
            filter_service: FilterService
    ) -> List:
        """Apply all specified filters."""


        filter_gen = FilterGenerator(filter_service, matrix)
        return filter_gen.generate_all(args)

    def _generate_charts(
            self,
            matrix: pd.DataFrame,
            args: AnalysisArgs,
            chart_gen: ChartGenerator
    ) -> List:
        """Generate all requested charts."""
        return chart_gen.generate_all(matrix, args)

    def _generate_maps(
            self,
            matrix: pd.DataFrame,
            args: AnalysisArgs,
            map_gen: MapGenerator
    ) -> List:
        """Generate all requested maps."""
        return map_gen.generate_all(matrix, args)

    def _apply_filter_for_maps(
            self,
            result: AnalysisResult,
            args: AnalysisArgs,
            matrix: pd.DataFrame,
            chart_gen: ChartGenerator,
            map_gen: MapGenerator,
            filter_service: FilterService
    ) -> AnalysisResult:
        """Apply filter and generate filtered maps."""
        # Load filtered stations
        stations = filter_service.load_filter_stations(args.filter_result_filename)

        if not stations:
            logger.warning("No stations from filter, skipping map generation")
            return result

        # Append stations to map specs
        stations_str = ";".join(str(s) for s in stations)

        modified_args = args.copy(deep=True)

        # Add stations to map specifications
        if args.mapa_densidad:
            if "+" not in args.mapa_densidad:
                modified_args.mapa_densidad = f"{args.mapa_densidad}+{stations_str}"

        if args.mapa_circulo:
            if "+" not in args.mapa_circulo:
                modified_args.mapa_circulo = f"{args.mapa_circulo}+{stations_str}"

        if args.video_densidad:
            if "+" not in args.video_densidad:
                modified_args.video_densidad = f"{args.video_densidad}+{stations_str}"

        # Generate maps with filtered stations
        result.maps = map_gen.generate_all(matrix, modified_args)

        # Generate charts (unfiltered)
        result.charts = chart_gen.generate_all(matrix, args)

        return result

    def _apply_filter_for_graphs(
            self,
            result: AnalysisResult,
            args: AnalysisArgs,
            matrix: pd.DataFrame,
            chart_gen: ChartGenerator,
            filter_service: FilterService
    ) -> AnalysisResult:
        """Apply filter and generate filtered graphs."""
        # Load filtered stations
        stations = filter_service.load_filter_stations(args.filter_result_filename)

        if not stations:
            logger.warning("No stations from filter, skipping graph generation")
            return result

        # Create modified args with filtered stations
        modified_args = args.copy(deep=True)

        # Build station-days specs for line comparison
        station_days_list = [
            StationDaySpec(station_id=st, days="all")
            for st in stations
        ]
        modified_args.graf_linea_comp_est = station_days_list

        # Use first station for bar charts
        if stations:
            first_station = stations[0]
            if args.graf_barras_est_med:
                modified_args.graf_barras_est_med = f"{first_station}-all"
            if args.graf_barras_est_acum:
                modified_args.graf_barras_est_acum = f"{first_station}-all"

        # Generate charts with filtered stations
        result.charts = chart_gen.generate_all(matrix, modified_args)

        return result
