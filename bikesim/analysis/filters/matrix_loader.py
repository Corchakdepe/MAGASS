"""Matrix loading for filter operations."""

import logging
from pathlib import Path

import pandas as pd
from fastapi import HTTPException

from bikesim.auxiliares import auxiliar_ficheros

logger = logging.getLogger(__name__)

# Matrix ID mapping based on your documentation (Table 9 from the TFG)
MATRIX_MAPPING = {
    "0": "Ocupacion_Original",
    "1": "Ocupacion_Relativa",
    "2": "Kilometros_Coger",
    "3": "Kilometros_Dejar",
    "4": "Peticiones_Resueltas_Coger",
    "5": "Peticiones_Resueltas_Dejar",
    "6": "Peticiones_NoResueltas_Coger",
    "7": "Peticiones_NoResueltas_Dejar",
    "8": "Kilometros_Ficticios_Coger",
    "9": "Kilometros_Ficticios_Dejar",
    "10": "Peticiones_Resueltas_Ficticias_Coger",
    "11": "Peticiones_Resueltas_Ficticias_Dejar",
    "12": "Peticiones_NoResueltas_Ficticia_Coger",
    "13": "Peticiones_NoResueltas_Ficticia_Dejar",
    "-1": "Custom",  # External custom matrix
}


def load_matrix(input_folder: str, matrix_selection: str) -> pd.DataFrame:
    """
    Load only the specific matrix needed for filtering.
    This avoids loading all matrices.

    Args:
        input_folder: Input directory path
        matrix_selection: Matrix selection ID (e.g., "1" for Ocupacion_Relativa)

    Returns:
        Loaded matrix as DataFrame

    Raises:
        HTTPException: If matrix file not found
    """
    matrix_name = MATRIX_MAPPING.get(matrix_selection, "Ocupacion_Relativa")
    logger.info(f"Looking for matrix: {matrix_name} with selection ID: {matrix_selection}")

    # For custom matrices (ID -1)
    if matrix_selection == "-1":
        files = auxiliar_ficheros.buscar_archivosEntrada(input_folder, ["Custom"])
        if not files:
            files = auxiliar_ficheros.buscar_archivosEntrada(input_folder, [".*Custom.*"])
    else:
        # Try to find the matrix file with the exact name pattern
        files = auxiliar_ficheros.buscar_archivosEntrada(input_folder, [matrix_name])

    if not files:
        # Try with broader pattern (without underscores)
        pattern = matrix_name.replace("_", "")
        files = auxiliar_ficheros.buscar_archivosEntrada(input_folder, [pattern])

    if not files:
        # Try to find any file that might contain the matrix name
        all_files = auxiliar_ficheros.buscar_archivosEntrada(input_folder, [".*"])
        matrix_keywords = matrix_name.lower().replace("_", "")
        matching_files = [
            f for f in all_files
            if matrix_keywords in Path(f).name.lower().replace("_", "")
        ]
        if matching_files:
            files = matching_files

    if not files:
        # List available files for debugging
        all_files = auxiliar_ficheros.buscar_archivosEntrada(input_folder, [".*"])
        file_names = [Path(f).name for f in all_files[:20]]  # Show first 20 files
        logger.error(f"Available files: {file_names}")

        # Try to find any matrix file as fallback
        matrix_files = [
            f for f in all_files
            if any(keyword in Path(f).name.lower() for keyword in
                   ["ocupacion", "peticiones", "kilometros", "custom"])
        ]

        if matrix_files:
            # Use the first matrix file found as fallback
            files = [matrix_files[0]]
            logger.warning(f"Using fallback matrix file: {Path(files[0]).name}")
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Matrix file not found for selection {matrix_selection} (tried: {matrix_name})"
            )

    # Load matrix
    try:
        df = pd.read_csv(files[0])
        logger.info(f"Loaded matrix: {Path(files[0]).name}, shape: {df.shape}")

        # Log column names for debugging
        logger.debug(f"Columns: {df.columns.tolist()[:5]}...")

        return df
    except Exception as e:
        logger.error(f"Error loading matrix file {files[0]}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error loading matrix file: {str(e)}"
        )


def load_matrix_by_pattern(input_folder: str, pattern: str) -> pd.DataFrame:
    """
    Load a matrix by pattern matching.

    Args:
        input_folder: Input directory path
        pattern: Pattern to search for in filename

    Returns:
        Loaded matrix as DataFrame

    Raises:
        HTTPException: If matrix file not found
    """
    files = auxiliar_ficheros.buscar_archivosEntrada(input_folder, [pattern])

    if not files:
        # Try with case-insensitive pattern
        all_files = auxiliar_ficheros.buscar_archivosEntrada(input_folder, [".*"])
        matching_files = [
            f for f in all_files
            if pattern.lower() in Path(f).name.lower()
        ]
        if matching_files:
            files = matching_files

    if not files:
        raise HTTPException(
            status_code=404,
            detail=f"Matrix file not found with pattern: {pattern}"
        )

    df = pd.read_csv(files[0])
    logger.info(f"Loaded matrix by pattern: {Path(files[0]).name}, shape: {df.shape}")

    return df


def get_available_matrices(input_folder: str) -> dict:
    """
    Get list of available matrices in the input folder.

    Args:
        input_folder: Input directory path

    Returns:
        Dictionary of matrix names and their selection IDs
    """
    all_files = auxiliar_ficheros.buscar_archivosEntrada(input_folder, [".*"])

    available = {}
    for file_path in all_files:
        filename = Path(file_path).name.lower()
        for matrix_id, matrix_name in MATRIX_MAPPING.items():
            if matrix_name.lower().replace("_", "") in filename.replace("_", ""):
                available[matrix_id] = {
                    "name": matrix_name,
                    "file": Path(file_path).name,
                    "id": matrix_id
                }
                break

    return available


def get_matrix_info(input_folder: str, matrix_selection: str) -> dict:
    """
    Get information about a matrix without loading it.

    Args:
        input_folder: Input directory path
        matrix_selection: Matrix selection ID

    Returns:
        Dictionary with matrix information
    """
    matrix_name = MATRIX_MAPPING.get(matrix_selection, "Unknown")

    files = auxiliar_ficheros.buscar_archivosEntrada(input_folder, [matrix_name])

    if not files:
        return {
            "id": matrix_selection,
            "name": matrix_name,
            "found": False
        }

    file_path = Path(files[0])
    return {
        "id": matrix_selection,
        "name": matrix_name,
        "found": True,
        "file": file_path.name,
        "size": file_path.stat().st_size
    }