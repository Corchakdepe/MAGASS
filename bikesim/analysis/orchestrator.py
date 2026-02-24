"""Main orchestrator for analysis workflow."""

import logging
from pathlib import Path
from typing import Dict, List, Optional
import pandas as pd

from bikesim.core.models import AnalysisArgs, AnalysisResult
from bikesim.core.exceptions import DataLoadError
from bikesim.analysis.matrix_manager import MatrixManager
from bikesim.analysis.chart_manager import ChartManager
from bikesim.analysis.map_manager import MapManager
from bikesim.analysis.filter_manager import FilterManager
from bikesim import Constantes
from bikesim.utils import GuardarCargarMatrices

logger = logging.getLogger(__name__)


class AnalysisOrchestrator:
    """Orchestrates the complete analysis workflow."""

    def __init__(self, args: AnalysisArgs):
        """
        Initialize orchestrator.

        Args:
            args: Analysis arguments
        """
        self.args = args
        self.input_folder = Path(args.input_folder)
        self.output_folder = Path(args.output_folder)
        self.output_folder.mkdir(exist_ok=True, parents=True)

        # Managers (initialized after matrix loading)
        self.matrix_manager: Optional[MatrixManager] = None
        self.chart_manager: Optional[ChartManager] = None
        self.map_manager: Optional[MapManager] = None
        self.filter_manager: Optional[FilterManager] = None

        # Data
        self.matrices: Optional[Dict] = None
        self.summary: Optional[List] = None
        self.desired_matrix: Optional[pd.DataFrame] = None
        self.total_days: int = 0

    def execute(self) -> AnalysisResult:
        """
        Execute complete analysis workflow.

        Returns:
            Analysis result with all outputs
        """
        logger.info(f"Starting analysis: {self.input_folder} -> {self.output_folder}")

        # Step 1: Load data
        self._load_matrices()

        # Step 2: Set constants
        self._configure_constants()

        # Step 3: Process matrix
        self._process_matrix()

        # Step 4: Initialize managers
        self._initialize_managers()

        # Step 5: Execute analysis tasks
        result = self._execute_analysis_tasks()

        logger.info(
            f"Analysis complete: {len(result.charts)} charts, "
            f"{len(result.maps)} maps, {len(result.filters)} filters"
        )

        return result

    def _load_matrices(self) -> None:
        """Load matrices from input folder."""
        try:
            self.matrices, self.summary = GuardarCargarMatrices.cargarSimulacionesParaAnalisis(
                str(self.input_folder)
            )
            logger.info(f"Loaded matrices from {self.input_folder}")
        except Exception as e:
            logger.error(f"Failed to load matrices: {e}")
            raise DataLoadError(f"Could not load matrices: {e}") from e

    def _configure_constants(self) -> None:
        """Set global constants from summary."""
        Constantes.DELTA_TIME = float(self.summary[0])
        Constantes.PORCENTAJE_ESTRES = float(self.summary[1])
        Constantes.COSTE_ANDAR = float(self.summary[2])
        Constantes.RUTA_SALIDA = str(self.output_folder)

        logger.info(
            f"Configured constants: delta={Constantes.DELTA_TIME}, "
            f"stress={Constantes.PORCENTAJE_ESTRES}, walk_cost={Constantes.COSTE_ANDAR}"
        )

    def _process_matrix(self) -> None:
        """Process and transform the desired matrix."""
        self.matrix_manager = MatrixManager(self.matrices)

        # Select and aggregate
        self.desired_matrix = self.matrix_manager.select_and_aggregate(
            self.args.seleccion_agregacion
        )

        # Apply delta transformations
        if self.args.delta_media:
            self.desired_matrix = self.matrix_manager.apply_delta_mean(
                self.desired_matrix,
                self.args.delta_media
            )

        if self.args.delta_acumulada:
            self.desired_matrix = self.matrix_manager.apply_delta_accumulation(
                self.desired_matrix,
                self.args.delta_acumulada
            )

        # Calculate total days
        self.total_days = self.desired_matrix.shape[0] // 24

        # Save desired matrix
        self.matrix_manager.save_matrix(
            self.desired_matrix,
            self.output_folder / "ficheroMatrizDeseada.csv"
        )

        logger.info(
            f"Processed matrix: shape={self.desired_matrix.shape}, "
            f"days={self.total_days}, delta={Constantes.DELTA_TIME}"
        )

    def _initialize_managers(self) -> None:
        """Initialize all task managers."""
        self.chart_manager = ChartManager(
            self.output_folder,
            self.total_days,
            int(Constantes.DELTA_TIME)
        )

        self.map_manager = MapManager(
            self.output_folder,
            Constantes.COORDENADAS
        )

        self.filter_manager = FilterManager(
            self.output_folder,
            int(Constantes.DELTA_TIME),
            self.total_days
        )

    def _execute_analysis_tasks(self) -> AnalysisResult:
        """
        Execute all analysis tasks based on arguments.

        Returns:
            Analysis result
        """
        result = AnalysisResult(output_folder=str(self.output_folder))

        # Apply filters first if specified
        if self._should_apply_filters():
            result.filters = self.filter_manager.apply_all_filters(
                self.desired_matrix,
                self.args
            )

        # Handle special filter workflows
        if self.args.use_filter_for_maps:
            return self._execute_filter_for_maps_workflow(result)

        if self.args.use_filter_for_graphs:
            return self._execute_filter_for_graphs_workflow(result)

        # Standard workflow: generate all outputs
        result.charts = self.chart_manager.generate_all_charts(
            self.desired_matrix,
            self.args
        )

        result.maps = self.map_manager.generate_all_maps(
            self.desired_matrix,
            self.args
        )

        return result

    def _should_apply_filters(self) -> bool:
        """Check if any filters should be applied."""
        return any([
            self.args.filtrado_EstValor and self.args.filtrado_EstValor != "_",
            self.args.filtrado_EstValorDias and self.args.filtrado_EstValorDias != "_",
            self.args.filtrado_Horas and self.args.filtrado_Horas != "_",
            self.args.filtrado_PorcentajeEstaciones and self.args.filtrado_PorcentajeEstaciones != "_",
            self.args.filtro and self.args.tipo_filtro and self.args.filtro != "_"
        ])

    def _execute_filter_for_maps_workflow(self, result: AnalysisResult) -> AnalysisResult:
        """Execute workflow where filters are applied to map generation."""
        # Load filtered stations
        stations = self.filter_manager.load_filter_result(
            self.args.filter_result_filename
        )

        if not stations:
            logger.warning("No stations from filter, skipping map generation")
            return result

        # Generate maps with filtered stations
        modified_args = self._add_stations_to_map_specs(self.args, stations)
        result.maps = self.map_manager.generate_all_maps(
            self.desired_matrix,
            modified_args
        )

        # Generate unfiltered charts
        result.charts = self.chart_manager.generate_all_charts(
            self.desired_matrix,
            self.args
        )

        return result

    def _execute_filter_for_graphs_workflow(self, result: AnalysisResult) -> AnalysisResult:
        """Execute workflow where filters are applied to graph generation."""
        # Load filtered stations
        stations = self.filter_manager.load_filter_result(
            self.args.filter_result_filename
        )

        if not stations:
            logger.warning("No stations from filter, skipping graph generation")
            return result

        # Generate charts with filtered stations
        modified_args = self._add_stations_to_chart_specs(self.args, stations)
        result.charts = self.chart_manager.generate_all_charts(
            self.desired_matrix,
            modified_args
        )

        return result

    def _add_stations_to_map_specs(
            self,
            args: AnalysisArgs,
            stations: List[int]
    ) -> AnalysisArgs:
        """Add filtered stations to map specifications."""
        modified_args = args.copy(deep=True)
        stations_str = ";".join(str(s) for s in stations)

        if args.mapa_densidad and "+" not in args.mapa_densidad:
            modified_args.mapa_densidad = f"{args.mapa_densidad}+{stations_str}"

        if args.mapa_circulo and "+" not in args.mapa_circulo:
            modified_args.mapa_circulo = f"{args.mapa_circulo}+{stations_str}"

        if args.video_densidad and "+" not in args.video_densidad:
            modified_args.video_densidad = f"{args.video_densidad}+{stations_str}"

        return modified_args

    def _add_stations_to_chart_specs(
            self,
            args: AnalysisArgs,
            stations: List[int]
    ) -> AnalysisArgs:
        """Add filtered stations to chart specifications."""
        from bikesim.core.models import StationDaySpec

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

        return modified_args
