"""Filter-related Pydantic models."""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class FilterType(str, Enum):
    """Filter types enumeration."""
    ESTACIONES_DIA = "estaciones_dia"  # Filter stations that meet condition during a day
    ESTACIONES_MES = "estaciones_mes"  # Filter stations that meet condition during the month
    HORAS = "horas"  # Filter hours where a percentage of stations meet condition
    PORCENTAJE_TIEMPO = "porcentaje_tiempo"  # Filter percentage of time


# Request models for each filter type
class FilterEstacionesDiaRequest(BaseModel):
    input_folder: str
    output_folder: str
    operator: str = Field(..., description="Comparison operator (>, <, >=, <=, ==, !=)")
    value: float
    times_per_day: int = Field(..., description="Number of times condition must be met in a day")
    day_index: int = Field(..., description="Day index to filter (0-based)")
    matrix_selection: str = Field("1", description="Matrix selection ID (1 for occupancy relative)")


class FilterEstacionesMesRequest(BaseModel):
    input_folder: str
    output_folder: str
    operator: str
    value: float
    times_per_day: int
    days: str = Field(..., description="Day indices separated by '#' or 'all'")
    exception_days: int = Field(5, description="Number of exception days allowed")
    matrix_selection: str = Field("1", description="Matrix selection ID (1 for occupancy relative)")


class FilterHorasRequest(BaseModel):
    input_folder: str
    output_folder: str
    operator: str
    value: float
    percentage: float = Field(..., ge=0, le=100, description="Percentage of stations (0-100)")
    matrix_selection: str = Field("1", description="Matrix selection ID (1 for occupancy relative)")


class FilterPorcentajeTiempoRequest(BaseModel):
    input_folder: str
    output_folder: str
    operator: str
    value: float
    stations: str = Field(..., description="Station indices separated by ';'")
    matrix_selection: str = Field("1", description="Matrix selection ID (1 for occupancy relative)")


# Response model
class FilterResponse(BaseModel):
    success: bool
    filter_type: str
    data: List[int]  # Can be stations, hours, or percentage as single-item list
    result_file: str
    message: str