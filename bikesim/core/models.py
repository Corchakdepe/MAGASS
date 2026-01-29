"""Pydantic models for the application."""

from __future__ import annotations
from typing import Optional, List, Dict, Any, Literal, Union
from pathlib import Path
from datetime import datetime
from pydantic import BaseModel, Field, validator



# ============================================
# SIMULATION MODELS
# ============================================

class SimulationParams(BaseModel):
    """Parameters for creating a new simulation."""
    stress_type: int
    stress: float
    walk_cost: float
    delta: int
    simname: Optional[str] = None
    cityname: Optional[str] = None
    number_of_stations: Optional[int] = None
    number_of_bikes: Optional[int] = None
    simdata: Optional[Dict[str, Any]] = None


class SimulationMetadata(BaseModel):
    """Metadata for a simulation run."""
    simname: str
    simfolder: str
    cityname: Optional[str] = None
    numberOfStations: Optional[int] = None
    numberOfBikes: Optional[int] = None
    simdata: Dict[str, Any] = Field(default_factory=dict)
    simdataId: str
    created: Optional[str] = None
    file_count: Optional[int] = None
    path: Optional[str] = None


class SimulationHistory(BaseModel):
    """Container for simulation history."""
    simulations: List[SimulationMetadata] = Field(default_factory=list)


# ============================================
# ANALYSIS MODELS
# ============================================

class StationDaySpec(BaseModel):
    """Specification for station and days in analysis."""
    station_id: int
    days: Union[str, List[int]]  # "all" or list of day indices

    @validator('days', pre=True)
    def parse_days(cls, v):
        if isinstance(v, str):
            return v
        if isinstance(v, list):
            return v
        raise ValueError("days must be 'all' or list of integers")


class FilterSpec(BaseModel):
    """Base filter specification."""
    filter_type: str
    operator: str
    value: float


class EstValorDiasFilter(FilterSpec):
    """Filter for stations exceeding value on multiple days."""
    filter_type: Literal["EstValorDias"] = "EstValorDias"
    times: int  # How many times value must be exceeded
    days: List[int]
    exception_days: int = 0  # Days allowed not to meet criteria

    @classmethod
    def parse(cls, spec: str) -> EstValorDiasFilter:
        """Parse from string: 'operatorValue;times;days;exception_days'"""
        parts = spec.split(";")
        if len(parts) != 4:
            raise ValueError(f"Expected 4 parts, got {len(parts)}")

        # Parse operator and value
        op_value = parts[0]
        if op_value.startswith(">="):
            operator, value = ">=", float(op_value[2:])
        elif op_value.startswith("<="):
            operator, value = "<=", float(op_value[2:])
        elif op_value.startswith(">"):
            operator, value = ">", float(op_value[1:])
        elif op_value.startswith("<"):
            operator, value = "<", float(op_value[1:])
        elif op_value.startswith("=="):
            operator, value = "==", float(op_value[2:])
        else:
            raise ValueError(f"Unknown operator in {op_value}")

        times = int(parts[1])
        days_str = parts[2]
        exception_days = int(parts[3])

        # Parse days
        if days_str == "all":
            days = []  # Will be filled later with actual day count
        else:
            days = list(map(int, days_str.split(";")))

        return cls(
            operator=operator,
            value=value,
            times=times,
            days=days,
            exception_days=exception_days
        )


class HorasFilter(FilterSpec):
    """Filter for hours where percentage of stations exceed value."""
    filter_type: Literal["Horas"] = "Horas"
    station_percentage: float

    @classmethod
    def parse(cls, spec: str) -> HorasFilter:
        """Parse from string: 'operatorValue;percentage'"""
        parts = spec.split(";")
        if len(parts) != 2:
            raise ValueError(f"Expected 2 parts, got {len(parts)}")

        # Parse operator and value
        op_value = parts[0]
        if op_value.startswith(">="):
            operator, value = ">=", float(op_value[2:])
        elif op_value.startswith(">"):
            operator, value = ">", float(op_value[1:])
        else:
            raise ValueError(f"Unknown operator in {op_value}")

        percentage = float(parts[1])

        return cls(
            operator=operator,
            value=value,
            station_percentage=percentage
        )


class AnalysisArgs(BaseModel):
    """Arguments for analysis execution."""
    input_folder: str
    output_folder: str
    seleccion_agregacion: str
    delta_media: Optional[int] = None
    delta_acumulada: Optional[int] = None

    # Charts
    graf_barras_est_med: Optional[str] = None
    graf_barras_est_acum: Optional[str] = None
    graf_barras_dia: Optional[str] = None
    graf_linea_comp_est: Optional[List[StationDaySpec]] = None
    graf_linea_comp_mats: Optional[str] = None

    # Maps
    mapa_densidad: Optional[str] = None
    video_densidad: Optional[str] = None
    mapa_voronoi: Optional[str] = None
    mapa_circulo: Optional[str] = None
    mapa_desplazamientos: Optional[str] = None

    # Filters
    filtrado_EstValor: Optional[str] = None
    filtrado_EstValorDias: Optional[str] = None
    filtrado_Horas: Optional[str] = None
    filtrado_PorcentajeEstaciones: Optional[str] = None

    filtro: Optional[str] = None
    tipo_filtro: Optional[str] = None

    # Filter application flags
    use_filter_for_maps: bool = False
    use_filter_for_graphs: bool = False
    filter_result_filename: Optional[str] = None
    apply_filter_to_line_comp: bool = False


class AnalysisRequest(AnalysisArgs):
    """Extended analysis args with additional API fields."""
    pass


# ============================================
# OUTPUT MODELS
# ============================================

class ChartMetadata(BaseModel):
    """Metadata for a generated chart."""
    id: str
    kind: Literal["timeseries", "comparison", "distribution", "accumulation", "station_series"]
    format: Literal["json"]
    visualization: Dict[str, Any]
    data: Dict[str, Any]
    context: Dict[str, Any]
    file_path: Optional[str] = None


class MapMetadata(BaseModel):
    """Metadata for a generated map."""
    id: str
    kind: Literal["density", "circle", "voronoi", "displacement"]
    format: Literal["html", "png"]
    name: str
    url: str
    file_path: Optional[str] = None
    instant: Optional[int] = None
    stations: Optional[List[int]] = None


class FilterResult(BaseModel):
    """Result of filter operation."""
    filter_type: str
    stations: Optional[List[int]] = None
    hours: Optional[List[int]] = None
    percentage: Optional[float] = None
    file_path: str


class AnalysisResult(BaseModel):
    """Complete result of analysis operation."""
    ok: bool = True
    charts: List[ChartMetadata] = Field(default_factory=list)
    maps: List[MapMetadata] = Field(default_factory=list)
    filters: List[FilterResult] = Field(default_factory=list)
    output_folder: Optional[str] = None


# ============================================
# RESULT ITEM MODELS
# ============================================

class ResultItem(BaseModel):
    """Generic result item (map, chart, filter)."""
    id: str
    name: str
    kind: Literal["map", "graph", "filter"]
    format: str
    url: str
    api_full_url: Optional[str] = None
    created: str
