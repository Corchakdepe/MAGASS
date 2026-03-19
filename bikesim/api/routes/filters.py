"""Filter API endpoints."""

import logging
from fastapi import APIRouter, HTTPException

from bikesim.analysis.filters.models import (
    FilterEstacionesDiaRequest,
    FilterEstacionesMesRequest,
    FilterHorasRequest,
    FilterPorcentajeTiempoRequest,
    FilterResponse,
    FilterType
)
from bikesim.analysis.filters.matrix_loader import load_matrix
from bikesim.analysis.filters.processors import (
    apply_filter_estaciones_dia,
    apply_filter_estaciones_mes,
    apply_filter_horas,
    apply_filter_porcentaje_tiempo
)
from bikesim.analysis.filters.utils import build_filter_display, save_filter_result

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/filter/estaciones-dia", response_model=FilterResponse)
async def filter_stations_by_day(request: FilterEstacionesDiaRequest):
    """
    Filter stations that meet a condition during a specific day.

    Example: Find stations with >65% occupancy at least 20 times on day 0
    """
    try:
        filter_display = build_filter_display(
            FilterType.ESTACIONES_DIA,
            operator=request.operator,
            value=request.value,
            times_per_day=request.times_per_day,
            day_index=request.day_index
        )

        logger.info(f"Running day filter: {filter_display}")

        # Load only the needed matrix
        matrix = load_matrix(request.input_folder, request.matrix_selection)

        # Apply filter
        stations = apply_filter_estaciones_dia(
            matrix,
            request.operator,
            request.value,
            request.times_per_day,
            request.day_index
        )

        # Save result
        result_file = save_filter_result(
            request.output_folder,
            stations,
            FilterType.ESTACIONES_DIA,
            filter_display
        )

        return FilterResponse(
            success=True,
            filter_type="estaciones_dia",
            data=stations,
            result_file=str(result_file),
            message=f"Found {len(stations)} stations meeting the condition"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in filter_stations_by_day: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/filter/estaciones-mes", response_model=FilterResponse)
async def filter_stations_by_month(request: FilterEstacionesMesRequest):
    """
    Filter stations that meet a condition during the month.

    Example: Find stations with >65% occupancy at least 20 times per day in 85% of days
    """
    try:
        filter_display = build_filter_display(
            FilterType.ESTACIONES_MES,
            operator=request.operator,
            value=request.value,
            times_per_day=request.times_per_day,
            days=request.days,
            exception_days=request.exception_days
        )

        logger.info(f"Running month filter: {filter_display}")

        # Load only the needed matrix
        matrix = load_matrix(request.input_folder, request.matrix_selection)

        # Apply filter
        stations = apply_filter_estaciones_mes(
            matrix,
            request.operator,
            request.value,
            request.times_per_day,
            request.days,
            request.exception_days
        )

        # Save result
        result_file = save_filter_result(
            request.output_folder,
            stations,
            FilterType.ESTACIONES_MES,
            filter_display
        )

        return FilterResponse(
            success=True,
            filter_type="estaciones_mes",
            data=stations,
            result_file=str(result_file),
            message=f"Found {len(stations)} stations meeting the condition"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in filter_stations_by_month: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/filter/horas", response_model=FilterResponse)
async def filter_hours(request: FilterHorasRequest):
    """
    Filter hours where a percentage of stations meet a condition.

    Example: Find hours where at least 35% of stations have >65% occupancy
    """
    try:
        filter_display = build_filter_display(
            FilterType.HORAS,
            operator=request.operator,
            value=request.value,
            percentage=request.percentage
        )

        logger.info(f"Running hours filter: {filter_display}")

        # Load only the needed matrix
        matrix = load_matrix(request.input_folder, request.matrix_selection)

        # Apply filter
        hours = apply_filter_horas(
            matrix,
            request.operator,
            request.value,
            request.percentage
        )

        # Save result
        result_file = save_filter_result(
            request.output_folder,
            hours,
            FilterType.HORAS,
            filter_display
        )

        return FilterResponse(
            success=True,
            filter_type="horas",
            data=hours,
            result_file=str(result_file),
            message=f"Found {len(hours)} hours meeting the condition"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in filter_hours: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/filter/porcentaje-tiempo", response_model=FilterResponse)
async def filter_time_percentage(request: FilterPorcentajeTiempoRequest):
    """
    Get the percentage of time that a set of stations meet a condition.

    Example: Get percentage of time stations 1,15,26 have >55% occupancy simultaneously
    """
    try:
        filter_display = build_filter_display(
            FilterType.PORCENTAJE_TIEMPO,
            operator=request.operator,
            value=request.value,
            stations=request.stations
        )

        logger.info(f"Running time percentage filter: {filter_display}")

        # Load only the needed matrix
        matrix = load_matrix(request.input_folder, request.matrix_selection)

        # Apply filter
        percentage = apply_filter_porcentaje_tiempo(
            matrix,
            request.operator,
            request.value,
            request.stations
        )

        # Save result
        result_file = save_filter_result(
            request.output_folder,
            [int(percentage)],
            FilterType.PORCENTAJE_TIEMPO,
            filter_display
        )

        return FilterResponse(
            success=True,
            filter_type="porcentaje_tiempo",
            data=[int(percentage)],
            result_file=str(result_file),
            message=f"Stations meet condition {percentage:.2f}% of the time"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in filter_time_percentage: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/filter/example-queries")
async def get_example_queries():
    """Get example filter queries based on the documentation"""
    return {
        "estaciones_dia": {
            "description": "Find stations with >65% occupancy at least 5 times on day 0",
            "example": {
                "input_folder": "./results/20260306_120449_sim_ST0_S0.00_WC0.00_D15",
                "output_folder": "./results/20260306_120449_sim_ST0_S0.00_WC0.00_D15",
                "operator": ">",
                "value": 65,
                "times_per_day": 5,
                "day_index": 0,
                "matrix_selection": "1"
            }
        },
        "estaciones_mes": {
            "description": "Find stations with >65% occupancy at least 20 times per day in 85% of days",
            "example": {
                "input_folder": "./results/20260306_120449_sim_ST0_S0.00_WC0.00_D15",
                "output_folder": "./results/20260306_120449_sim_ST0_S0.00_WC0.00_D15",
                "operator": ">",
                "value": 65,
                "times_per_day": 20,
                "days": "all",
                "exception_days": 5,
                "matrix_selection": "1"
            }
        },
        "horas": {
            "description": "Find hours where at least 35% of stations have >65% occupancy",
            "example": {
                "input_folder": "./results/20260306_120449_sim_ST0_S0.00_WC0.00_D15",
                "output_folder": "./results/20260306_120449_sim_ST0_S0.00_WC0.00_D15",
                "operator": ">",
                "value": 65,
                "percentage": 35,
                "matrix_selection": "1"
            }
        },
        "porcentaje_tiempo": {
            "description": "Get percentage of time stations 1,15,26,48,56 have >55% occupancy simultaneously",
            "example": {
                "input_folder": "./results/20260306_120449_sim_ST0_S0.00_WC0.00_D15",
                "output_folder": "./results/20260306_120449_sim_ST0_S0.00_WC0.00_D15",
                "operator": ">",
                "value": 55,
                "stations": "1;15;26;48;56",
                "matrix_selection": "1"
            }
        }
    }