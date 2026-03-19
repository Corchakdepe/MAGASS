import logging
from pathlib import Path
from typing import Dict
import pandas as pd

from bikesim import Constantes
from bikesim.utils import Agrupador
from bikesim.auxiliares import auxiliaresCalculos

logger = logging.getLogger(__name__)


class MatrixManager:
    def __init__(self, matrices: Dict):
        self.matrices = matrices

    def select_and_aggregate(self, selection_spec: str) -> pd.DataFrame:
        operation = 1

        if "(-)" in selection_spec:
            selection_spec = selection_spec.split(")")[1]
            operation = -1

        matrix_ids = list(map(int, selection_spec.split(";")))
        lista_matrices = Constantes.LISTA_MATRICES

        if Constantes.MATRIZ_CUSTOM is None or -1 not in matrix_ids:
            desired_matrix = self.matrices[lista_matrices[matrix_ids[0]]].matrix.copy()
            start_idx = 1
        else:
            desired_matrix = Constantes.MATRIZ_CUSTOM.matrix.copy()
            start_idx = 0

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
        matrix.to_csv(path, index=False)
        logger.info(f"Saved matrix to {path}")
