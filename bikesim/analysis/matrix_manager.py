"""Matrix selection, aggregation, and transformation."""

import logging
from pathlib import Path
from typing import Dict
import pandas as pd

from bikesim import Constantes
from bikesim.utils import Agrupador
from bikesim.auxiliares import auxiliaresCalculos

logger = logging.getLogger(__name__)


class MatrixManager:
    """Manages matrix selection, aggregation, and transformations."""

    def __init__(self, matrices: Dict):
        """
        Initialize manager.

        Args:
            matrices: Dictionary of available matrices
        """
        self.matrices = matrices

    def select_and_aggregate(self, selection_spec: str) -> pd.DataFrame:
        """
        Select and aggregate matrices based on specification.

        Args:
            selection_spec: Selection specification string
                Format: "id1;id2;..." or "(-) id1;id2;..." for subtraction

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
            desired_matrix = self.matrices[lista_matrices[matrix_ids[0]]].matrix.copy()
            start_idx = 1
        else:
            desired_matrix = Constantes.MATRIZ_CUSTOM.matrix.copy()
            start_idx = 0

        # Aggregate remaining matrices
        if len(matrix_ids) > 1:
            for i in range(start_idx, len(matrix_ids)):
                if matrix_ids[i] != -1:
                    matrix_to_add = self.matrices[lista_matrices[matrix_ids[i]]].matrix

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
        target_rows = self.matrices[Constantes.OCUPACION].matrix.shape[0] - 1
        desired_matrix = auxiliaresCalculos.rellenarFilasMatrizDeseada(
            desired_matrix,
            target_rows
        )

        logger.info(
            f"Selected and aggregated matrices: shape {desired_matrix.shape}, "
            f"operation={'add' if operation == 1 else 'subtract'}"
        )

        return desired_matrix

    def apply_delta_mean(
            self,
            matrix: pd.DataFrame,
            target_delta: int
    ) -> pd.DataFrame:
        """
        Apply mean aggregation to change delta time.

        Args:
            matrix: Input matrix
            target_delta: Target delta time

        Returns:
            Transformed matrix
        """
        current_delta = Constantes.DELTA_TIME

        logger.info(f"Applying delta mean: {current_delta} -> {target_delta}")

        transformed = Agrupador.colapsarDeltasMedia(
            matrix,
            current_delta,
            target_delta
        )

        Constantes.DELTA_TIME = int(target_delta)

        logger.info(f"Delta mean applied: new shape {transformed.shape}")
        return transformed

    def apply_delta_accumulation(
            self,
            matrix: pd.DataFrame,
            target_delta: int
    ) -> pd.DataFrame:
        """
        Apply accumulation aggregation to change delta time.

        Args:
            matrix: Input matrix
            target_delta: Target delta time

        Returns:
            Transformed matrix
        """
        current_delta = Constantes.DELTA_TIME

        logger.info(f"Applying delta accumulation: {current_delta} -> {target_delta}")

        transformed = Agrupador.colapsarDeltasAcumulacion(
            matrix,
            current_delta,
            target_delta
        )

        Constantes.DELTA_TIME = int(target_delta)

        logger.info(f"Delta accumulation applied: new shape {transformed.shape}")
        return transformed

    def save_matrix(self, matrix: pd.DataFrame, path: Path) -> None:
        """
        Save matrix to CSV file.

        Args:
            matrix: Matrix to save
            path: Output path
        """
        matrix.to_csv(path, index=False)
        logger.info(f"Saved matrix to {path}")
