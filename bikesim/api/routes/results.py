"""Results retrieval API routes."""

import logging
from datetime import datetime
from typing import Optional
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query, Request, Depends
from fastapi.responses import FileResponse, HTMLResponse

from bikesim.services.simulation_service import SimulationService
from bikesim.repositories.result_repository import ResultRepository
from bikesim.core.exceptions import SimulationNotFoundError
from bikesim.api.dependencies import get_simulation_service
from bikesim.config.constants import MAP_KINDS

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/list")
async def list_results(
    run: Optional[str] = Query(None, description="Simulation folder name"),
    kind: Optional[str] = Query(None, description="Filter by kind: map, graph, filter"),
    format: Optional[str] = Query(None, description="Filter by format: html, png, json, csv"),
    request: Request = None,
    service: SimulationService = Depends(get_simulation_service)
):
    """
    List all result files for a simulation run.

    Args:
        run: Simulation folder name (None for latest)
        kind: Filter by result kind
        format: Filter by file format

    Returns:
        List of result items with metadata
    """
    try:
        # Find simulation folder
        if run:
            folder = service.repository.find_by_folder_name(run)
        else:
            folder = service.repository.find_latest()

        if not folder:
            return {
                "items": [],
                "run": None,
                "api_base": str(request.base_url) if request else ""
            }

        # Initialize result repository
        result_repo = ResultRepository(folder)

        # Get API base URL
        api_base = str(request.base_url).rstrip("/") if request else ""
        items = []

        # List maps
        if not kind or kind == "map":
            map_files = result_repo.list_maps(
                kind=None,
                format=format
            )

            for file_path in map_files:
                ext = file_path.suffix.lower()
                fmt = "html" if ext == ".html" else "png"
                if format and fmt != format:
                    continue

                relative_url = f"/results/file/{folder.name}/{file_path.name}"
                items.append({
                    "id": f"{folder.name}:{file_path.name}",
                    "name": file_path.name,
                    "kind": "map",
                    "format": fmt,
                    "url": relative_url,
                    "api_full_url": f"{api_base}{relative_url}",
                    "created": file_path.stat().st_mtime
                })

        # List charts
        if not kind or kind == "graph":
            chart_files = result_repo.list_charts()
            for file_path in chart_files:
                if format and format != "json":
                    continue

                relative_url = f"/results/file/{folder.name}/{file_path.name}"
                items.append({
                    "id": f"{folder.name}:{file_path.name}",
                    "name": file_path.name,
                    "kind": "graph",
                    "format": "json",
                    "url": relative_url,
                    "api_full_url": f"{api_base}{relative_url}",
                    "created": file_path.stat().st_mtime
                })

        # List filters
        if not kind or kind == "filter":
            filter_files = result_repo.list_filters()
            for file_path in filter_files:
                if format and format != "csv":
                    continue

                relative_url = f"/results/file/{folder.name}/{file_path.name}"
                items.append({
                    "id": f"{folder.name}:{file_path.name}",
                    "name": file_path.name,
                    "kind": "filter",
                    "format": "csv",
                    "url": relative_url,
                    "api_full_url": f"{api_base}{relative_url}",
                    "created": file_path.stat().st_mtime
                })

        # Sort by creation time (most recent first)
        items.sort(key=lambda x: x["created"], reverse=True)

        return {
            "items": items,
            "run": folder.name,
            "api_base": api_base
        }

    except Exception as e:
        logger.error(f"Error listing results: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error listing results: {str(e)}"
        )


@router.get("/file/{run_folder}/{fname:path}")
async def get_result_file(
    run_folder: str,
    fname: str,
    service: SimulationService = Depends(get_simulation_service)
):
    """
    Serve individual result file.

    Args:
        run_folder: Simulation folder name
        fname: File name (can include subdirectories)

    Returns:
        File response
    """
    try:
        # Security: resolve paths and check they're within allowed folder
        allowed_folder = (service.config.results_folder / run_folder).resolve()
        file_path = (allowed_folder / fname).resolve()

        # Prevent path traversal
        if not str(file_path).startswith(str(allowed_folder)):
            raise HTTPException(
                status_code=400,
                detail=f"Path traversal detected: {fname}"
            )

        if not file_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"File not found: {fname}"
            )

        ext = file_path.suffix.lower()

        # Serve HTML maps directly as HTML response
        if ext == ".html":
            html_content = file_path.read_text(encoding="utf-8")
            return HTMLResponse(content=html_content)

        # Determine media type
        media_types = {
            ".png": "image/png",
            ".csv": "text/csv",
            ".json": "application/json",
            ".mp4": "video/mp4",
            ".txt": "text/plain"
        }

        media_type = media_types.get(ext, "application/octet-stream")
        return FileResponse(
            str(file_path),
            media_type=media_type,
            filename=file_path.name
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving file: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error serving file: {str(e)}"
        )


@router.get("/download")
async def download_results(
    folder_name: Optional[str] = Query(None, description="Simulation folder name"),
    service: SimulationService = Depends(get_simulation_service)
):
    """
    Download simulation summary file.

    Args:
        folder_name: Simulation folder name (None for latest)

    Returns:
        File download response
    """
    try:
        summary_file = service.get_summary_file(folder_name)
        if not summary_file or not summary_file.exists():
            raise HTTPException(
                status_code=404,
                detail="Summary file not found"
            )

        # Get folder name for filename
        if folder_name:
            folder = service.repository.find_by_folder_name(folder_name)
        else:
            folder = service.repository.find_latest()

        download_name = f"{folder.name}_summary.txt" if folder else "summary.txt"

        return FileResponse(
            path=str(summary_file),
            filename=download_name,
            media_type="text/plain"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading results: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error downloading results: {str(e)}"
        )
