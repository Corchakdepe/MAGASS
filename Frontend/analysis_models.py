from __future__ import annotations

from typing import Optional, List, Union

from pydantic import BaseModel


class StationDays(BaseModel):
    station_id: int
    days: Union[str, List[int]]


class AnalysisArgs(BaseModel):
    input_folder: str
    output_folder: str
    seleccion_agregacion: str

    use_filter_for_graphs: bool = False

    delta_media: Optional[int] = 60
    delta_acumulada: Optional[int] = None

    graf_barras_est_med: Optional[str] = None
    graf_barras_est_acum: Optional[str] = None
    graf_barras_dia: Optional[str] = None
    graf_linea_comp_est: Optional[List[StationDays]] = None
    graf_linea_comp_mats: Optional[str] = None

    mapa_densidad: Optional[str] = None
    video_densidad: Optional[str] = None
    mapa_voronoi: Optional[str] = None
    mapa_circulo: Optional[str] = None
    mapa_desplazamientos: Optional[str] = None

    filtrado_EstValor: Optional[str] = None
    filtrado_EstValorDias: Optional[str] = None
    filtrado_Horas: Optional[str] = None
    filtrado_PorcentajeEstaciones: Optional[str] = None

    filtro: Optional[str] = None
    tipo_filtro: Optional[str] = None

    use_filter_for_maps: bool = False
    filter_result_filename: Optional[str] = None
    map_user_name: Optional[str] = None


class SimulateArgs(BaseModel):
    ruta_entrada: str
    ruta_salida: Optional[str] = None
    stress_type: int
    stress: float
    walk_cost: float
    delta: int
    dias: Optional[List[int]] = None
    simname: Optional[str] = None
