"""Repository for matrix data access."""

import logging
from pathlib import Path
from typing import Dict, Tuple
import pandas as pd

from bikesim.core.exceptions import DataLoadError
from bikesim.utils import GuardarCargarMatrices

logger = logging.getLogger(__name__)


class MatrixRepository:
    """Handles loading and saving of matrix data."""

    def __init__(self, output_folder: Path):
        """
        Initialize repository.

        Args:
            output_folder: Default output folder for matrices
        """
        self.output_folder = output_folder

    def load_from_folder(self, input_folder: str) -> Tuple[Dict[str, any], list]:
        """
        Load all matrices from simulation folder.

        Args:
            input_folder: Path to simulation folder

        Returns:
            Tuple of (matrices_dict, summary_list)

        Raises:
            DataLoadError: If loading fails
        """
        try:
            matrices, summary = GuardarCargarMatrices.cargarSimulacionesParaAnalisis(
                input_folder
            )
            logger.info(f"Loaded matrices from {input_folder}")
            return matrices, summary
        except Exception as e:
            logger.error(f"Failed to load matrices from {input_folder}: {e}")
            raise DataLoadError(f"Could not load matrices: {e}") from e

    def save_matrix(
            self,
            matrix: pd.DataFrame,
            folder: Path,
            name: str
    ) -> Path:
        """
        Save matrix to CSV file.

        Args:
            matrix: DataFrame to save
            folder: Output folder
            name: Base filename (without timestamp)

        Returns:
            Path to saved file
        """
        try:
            folder.mkdir(exist_ok=True, parents=True)

            # Ensure .csv extension
            if not name.endswith(".csv"):
                name = f"{name}.csv"

            file_path = folder / name
            matrix.to_csv(file_path, index=False)

            logger.info(f"Saved matrix to {file_path}")
            return file_path
        except Exception as e:
            logger.error(f"Failed to save matrix: {e}")
            raise DataLoadError(f"Could not save matrix: {e}") from e

    def load_displacement_matrix(self, input_folder: str) -> pd.DataFrame:
        """
        Load displacement matrix from folder.

        Args:
            input_folder: Folder containing displacement CSV

        Returns:
            Displacement matrix as DataFrame

        Raises:
            DataLoadError: If no displacement file found or loading fails
        """
        from bikesim.config.constants import PATTERN_DISPLACEMENT
        import glob

        pattern = str(Path(input_folder) / PATTERN_DISPLACEMENT)
        candidates = glob.glob(pattern)

        if not candidates:
            raise DataLoadError(
                f"No displacement file matching {PATTERN_DISPLACEMENT} "
                f"found in {input_folder}"
            )

        if len(candidates) > 1:
            raise DataLoadError(
                f"Multiple displacement files found: {candidates}. "
                "Keep only one in the input folder."
            )

        try:
            df = pd.read_csv(candidates[0])
            logger.info(f"Loaded displacement matrix from {candidates[0]}")
            return df
        except Exception as e:
            logger.error(f"Failed to load displacement matrix: {e}")
            raise DataLoadError(
                f"Could not load displacement matrix: {e}"
            ) from e
