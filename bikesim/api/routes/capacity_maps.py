"""API endpoint for generating station capacity maps."""

import logging
import os
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
import pandas as pd
import numpy as np

from bikesim import Constantes
from bikesim.Representacion.ManejadorMapas import manejar_mapaCapacidades

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/maps/capacity")
async def generate_capacity_map(
    input_folder: str = Query(..., description="Folder containing simulation data"),
    output_folder: str = Query(..., description="Folder for output files"),
    lista_estaciones: Optional[str] = Query(None, description="Semicolon-separated station IDs to display"),
    mostrar_labels: bool = Query(False, description="Show popup labels by default")
):
    """
    Generate a map showing station capacities as colored circles.

    The map displays each station with a circle whose size and color represent its capacity.
    - Blue: Low capacity
    - Yellow: Medium capacity
    - Red: High capacity

    Args:
        input_folder: Path to simulation folder containing capacidades.csv and coordenadas.csv
        output_folder: Path where the map HTML file will be saved
        lista_estaciones: Optional semicolon-separated list of station IDs (e.g., "0;5;10")
        mostrar_labels: If True, popup labels are shown by default

    Returns:
        FileResponse with the generated HTML map file

    Raises:
        HTTPException: If required files are not found or generation fails
    """
    try:
        # Validate and resolve paths
        input_path = Path(input_folder)
        output_path = Path(output_folder)

        if not input_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Input folder not found: {input_folder}"
            )

        # Create output folder if it doesn't exist
        output_path.mkdir(parents=True, exist_ok=True)

        # Load capacity data
        capacidades_file = input_path / "capacidades.csv"
        if not capacidades_file.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Capacidades file not found: {capacidades_file}"
            )

        capacidades = pd.read_csv(capacidades_file, header=None)
        logger.info(f"Loaded capacities from {capacidades_file}")

        # Load coordinates
        coordenadas_file = input_path / "coordenadas.csv"
        if not coordenadas_file.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Coordinates file not found: {coordenadas_file}"
            )

        coordenadas = np.loadtxt(coordenadas_file, delimiter=',', skiprows=1)
        logger.info(f"Loaded coordinates from {coordenadas_file}")

        # Set output folder in Constantes for backend compatibility
        Constantes.RUTA_SALIDA = str(output_path)
        Constantes.COORDENADAS = coordenadas

        # Parse station list if provided
        estaciones_list = None
        if lista_estaciones and lista_estaciones.strip():
            try:
                estaciones_list = [int(x.strip()) for x in lista_estaciones.split(";")]
                logger.info(f"Filtering to stations: {estaciones_list}")
            except ValueError as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid station list format: {e}"
                )

        # Create map manager
        manager = manejar_mapaCapacidades(
            capacidades=capacidades,
            coordenadas=coordenadas,
            mostrarLabels=mostrar_labels,
            listaEstaciones=estaciones_list
        )

        # Generate map
        logger.info("Generating capacity map...")
        manager.cargarMapa(listaEstaciones=estaciones_list)

        # Get output file path
        map_file = manager.getFichero()

        if not os.path.exists(map_file):
            raise HTTPException(
                status_code=500,
                detail="Map generation succeeded but output file not found"
            )

        logger.info(f"Capacity map generated successfully: {map_file}")

        # Return the HTML file
        return FileResponse(
            path=map_file,
            media_type="text/html",
            filename="MapaCapacidades.html"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating capacity map: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate capacity map: {str(e)}"
        )


