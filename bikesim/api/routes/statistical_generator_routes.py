# bikesim/api/statistical_generator_routes.py
"""Statistical generator API routes."""

import logging
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, Literal
import pandas as pd
from os.path import join
from datetime import datetime
from pathlib import Path as Pathlib
import shutil
import glob
import os

from bikesim import Constantes
from bikesim.auxiliares import auxiliar_ficheros
from bikesim.utils.SimuladorDeltasEstadistico import SimuladorDeltasEstadistico

logger = logging.getLogger(__name__)
router = APIRouter()


class StatisticalGeneratorArgs(BaseModel):
    """Arguments for statistical generator."""
    ruta_entrada: str = Field(..., description="Path to input directory containing deltas file")
    delta_time: int = Field(..., description="Delta time in minutes", ge=1, le=60)
    dias_a_simular: int = Field(..., description="Number of days to generate", ge=1)
    tipo_generador: Literal[1, 2] = Field(..., description="Generator type: 1 for agregado, 2 for natural")
    simname: Optional[str] = Field(None, description="Custom name for the output folder")


@router.post("/exe/generar-estadistico")
async def execute_statistical_generator(args: StatisticalGeneratorArgs):
    """
    Execute statistical generator to create new delta files based on statistical behavior.

    - tipo_generador=1: Agregado - Collapses all days into one day pattern
    - tipo_generador=2: Natural - Uses day-by-day patterns from input data

    The output will be created in ./uploads/NewUpLoadThingGeneratedByStatiscalGenerator/
    and will contain all files from input with the generated delta file replacing the original.
    """
    try:
        logger.info(
            f"Starting statistical generator with tipo={args.tipo_generador}, delta={args.delta_time}, dias={args.dias_a_simular}")

        # Set constants
        Constantes.DELTA_TIME = args.delta_time

        # Validate input directory exists
        input_path = Pathlib(args.ruta_entrada)
        if not input_path.exists() or not input_path.is_dir():
            raise HTTPException(
                status_code=400,
                detail=f"Input directory does not exist: {args.ruta_entrada}"
            )

        # Find deltas file in input directory
        try:
            deltas_files = auxiliar_ficheros.buscar_archivosEntrada(args.ruta_entrada, ['deltas'])
            if not deltas_files:
                raise HTTPException(
                    status_code=400,
                    detail=f"No delta files found in {args.ruta_entrada}. Expected file containing 'deltas' in name."
                )
            ruta_deltas = deltas_files[0]
            logger.info(f"Found deltas file: {ruta_deltas}")
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Error finding delta files: {str(e)}"
            )

        # Read deltas matrix
        try:
            matriz_deltas = pd.read_csv(ruta_deltas)
            logger.info(f"Loaded deltas matrix with shape: {matriz_deltas.shape}")
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Error reading delta file: {str(e)}"
            )

        # Create output directory in ./uploads/NewUpLoadThingGeneratedByStatiscalGenerator
        base_upload_dir = Pathlib("./uploads")
        output_dir_name = "NewUpLoadThingGeneratedByStatiscalGenerator"

        # If simname is provided, append it to the folder name for uniqueness
        if args.simname:
            # Sanitize simname to be filesystem-friendly
            safe_simname = "".join(c for c in args.simname if c.isalnum() or c in (' ', '-', '_')).strip()
            safe_simname = safe_simname.replace(' ', '_')
            output_dir_name = f"{output_dir_name}_{safe_simname}"

        # Add timestamp for uniqueness
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir_name = f"{timestamp}_{output_dir_name}"

        output_path = base_upload_dir / output_dir_name

        # Create output directory
        output_path.mkdir(parents=True, exist_ok=False)  # exist_ok=False to ensure unique folder
        ruta_salida = str(output_path)

        logger.info(f"Created output directory: {ruta_salida}")

        # COPY ALL FILES FROM INPUT DIRECTORY TO OUTPUT DIRECTORY
        logger.info(f"Copying all files from {input_path} to {output_path}")

        # Copy all files and subdirectories
        for item in input_path.glob('*'):
            if item.is_file():
                shutil.copy2(item, output_path / item.name)
                logger.debug(f"Copied file: {item.name}")
            elif item.is_dir():
                shutil.copytree(item, output_path / item.name, dirs_exist_ok=True)
                logger.debug(f"Copied directory: {item.name}")

        logger.info(f"Successfully copied all files from input directory")

        Constantes.RUTA_SALIDA = ruta_salida

        # Initialize simulator
        simulador = SimuladorDeltasEstadistico(matriz_deltas, args.delta_time)

        # Generate based on tipo_generador
        try:
            if args.tipo_generador == 2:  # Natural
                logger.info(f"Using NATURAL generator for {args.dias_a_simular} days")
                nuevo_fichero = simulador.simularDatosEstadisticos_PeriodoTotal(args.dias_a_simular)
                generator_type_str = "natural"
            else:  # Agregado (1)
                logger.info(f"Using AGREGADO generator for {args.dias_a_simular} days")
                dias = list(range(args.dias_a_simular))
                nuevo_fichero = simulador.simularDatosEstadisticos_Horas(dias)
                generator_type_str = "agregado"

            # Find the original delta file pattern in the copied files
            # Look for files matching pattern: *_deltas.csv (e.g., Seville_2021-03-01_2021-03-31_15min_deltas.csv)
            delta_pattern = "*_deltas.csv"
            original_delta_files = list(output_path.glob(delta_pattern))

            if original_delta_files:
                # Replace the first matching file (there should be only one)
                original_delta_path = original_delta_files[0]
                logger.info(f"Replacing original delta file: {original_delta_path}")

                # Save the generated data with the SAME filename as the original
                nuevo_fichero.to_csv(original_delta_path, index=False)
                logger.info(f"Generated data saved, replacing original file: {original_delta_path}")

                # If there were multiple delta files, log a warning
                if len(original_delta_files) > 1:
                    logger.warning(
                        f"Found multiple delta files: {[f.name for f in original_delta_files]}. Only replaced the first one.")

                output_filename = original_delta_files[0].name
            else:
                # If no pattern match found, create a new file with standard naming
                logger.warning(f"No file matching pattern '{delta_pattern}' found. Creating new file instead.")
                output_filename = f"{timestamp}_deltasGeneradosEstadistica_{generator_type_str}_D{args.delta_time}_dias{args.dias_a_simular}.csv"
                output_file_path = output_path / output_filename
                nuevo_fichero.to_csv(output_file_path, index=False)
                logger.info(f"Created new file: {output_file_path}")

            # Create metadata file
            metadata = {
                "GENERATION_TYPE": "NATURAL" if args.tipo_generador == 2 else "AGREGADO",
                "DELTA_TIME": args.delta_time,
                "DAYS_GENERATED": args.dias_a_simular,
                "INPUT_FILE": str(ruta_deltas),
                "INPUT_DIRECTORY": args.ruta_entrada,
                "INPUT_SHAPE": list(matriz_deltas.shape),
                "OUTPUT_SHAPE": list(nuevo_fichero.shape),
                "GENERATED_AT": datetime.now().isoformat(),
                "SIMNAME": args.simname,
                "OUTPUT_DIRECTORY": ruta_salida,
                "REPLACED_FILE": output_filename if original_delta_files else None,
                "FILES_COPIED": len(list(output_path.glob('*')))
            }

            import json
            metadata_path = output_path / "generation_info.json"
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)

            # List all files in output directory for response
            output_files = [str(f.relative_to(output_path)) for f in output_path.glob('**/*') if f.is_file()]

            return {
                "ok": True,
                "output_folder": output_dir_name,
                "output_path": ruta_salida,
                "generator_type": generator_type_str,
                "delta_time": args.delta_time,
                "days_generated": args.dias_a_simular,
                "output_shape": list(nuevo_fichero.shape),
                "replaced_file": output_filename if original_delta_files else None,
                "files_copied": len(output_files),
                "all_files": output_files[:20],  # First 20 files for preview
                "message": f"Successfully generated {args.dias_a_simular} days using {generator_type_str} generator. All input files copied to {output_dir_name} and delta file updated."
            }

        except Exception as e:
            logger.error(f"Error during generation: {e}", exc_info=True)
            # Clean up output directory if generation failed
            if output_path.exists():
                shutil.rmtree(output_path)
                logger.info(f"Cleaned up output directory due to error: {output_path}")
            raise HTTPException(
                status_code=500,
                detail=f"Error during statistical generation: {str(e)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in statistical generator: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )


@router.get("/exe/statistical-generator/list-generated-folders")
async def list_statistical_generator_folders():
    """List all folders created by the statistical generator in ./uploads."""
    try:
        base_upload_dir = Pathlib("./uploads")

        if not base_upload_dir.exists():
            return {"folders": [], "total": 0}

        # Look for folders matching the pattern: *NewUpLoadThingGeneratedByStatiscalGenerator*
        generator_folders = []
        for folder in base_upload_dir.iterdir():
            if folder.is_dir() and "NewUpLoadThingGeneratedByStatiscalGenerator" in folder.name:
                # Get folder info
                folder_info = {
                    "name": folder.name,
                    "path": str(folder),
                    "created": datetime.fromtimestamp(folder.stat().st_ctime).isoformat(),
                    "modified": datetime.fromtimestamp(folder.stat().st_mtime).isoformat()
                }

                # Check for generation info
                info_file = folder / "generation_info.json"
                if info_file.exists():
                    try:
                        import json
                        with open(info_file, 'r') as f:
                            metadata = json.load(f)
                            folder_info["metadata"] = metadata
                    except:
                        pass

                # Count files
                folder_info["file_count"] = len(list(folder.glob('**/*')))

                # Find the delta file
                delta_files = list(folder.glob("*_deltas.csv"))
                if delta_files:
                    folder_info["delta_file"] = delta_files[0].name
                    folder_info["delta_file_size"] = delta_files[0].stat().st_size

                generator_folders.append(folder_info)

        # Sort by created date (newest first)
        generator_folders.sort(key=lambda x: x["created"], reverse=True)

        return {
            "folders": generator_folders,
            "total": len(generator_folders)
        }

    except Exception as e:
        logger.error(f"Error listing generator folders: {e}")
        raise HTTPException(status_code=500, detail=f"Error listing generator folders: {str(e)}")


@router.get("/exe/statistical-generator/folder-contents/{folder_name}")
async def get_generator_folder_contents(folder_name: str):
    """Get contents of a specific statistical generator folder."""
    try:
        folder_path = Pathlib("./uploads") / folder_name

        if not folder_path.exists() or not folder_path.is_dir():
            raise HTTPException(status_code=404, detail=f"Folder not found: {folder_name}")

        # Check if this is a statistical generator folder
        if "NewUpLoadThingGeneratedByStatiscalGenerator" not in folder_name:
            raise HTTPException(status_code=400, detail=f"Not a statistical generator folder: {folder_name}")

        # Get all files
        files = []
        for file_path in folder_path.glob('**/*'):
            if file_path.is_file():
                rel_path = str(file_path.relative_to(folder_path))
                files.append({
                    "name": rel_path,
                    "size": file_path.stat().st_size,
                    "modified": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
                })

        # Read generation info if exists
        metadata = {}
        info_file = folder_path / "generation_info.json"
        if info_file.exists():
            import json
            with open(info_file, 'r') as f:
                metadata = json.load(f)

        return {
            "folder_name": folder_name,
            "path": str(folder_path),
            "file_count": len(files),
            "files": files,
            "metadata": metadata
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting folder contents: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting folder contents: {str(e)}")


# In simulation_routes.py or a new downloads_routes.py

from fastapi.responses import StreamingResponse
import zipfile, io

@router.post("/exe/download-folder-zip")
async def download_folder_zip(request: dict):
    folder_path = request.get("folder_path")
    if not folder_path:
        raise HTTPException(status_code=400, detail="folder_path required")

    path = Pathlib(folder_path).resolve()
    base = Pathlib("./uploads").resolve()

    # Security: only allow zipping inside ./uploads
    if not str(path).startswith(str(base)):
        raise HTTPException(status_code=400, detail="Invalid path")
    if not path.exists() or not path.is_dir():
        raise HTTPException(status_code=404, detail=f"Folder not found: {folder_path}")

    def zip_stream():
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for file in path.rglob("*"):
                if file.is_file():
                    zf.write(file, file.relative_to(path))
        buf.seek(0)
        yield from buf

    return StreamingResponse(
        zip_stream(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{path.name}.zip"'},
    )
