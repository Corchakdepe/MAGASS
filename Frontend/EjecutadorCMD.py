from __future__ import annotations
import hashlib
import operator
import os
import shutil
import glob
from pathlib import Path
import json
from fastapi import FastAPI, HTTPException
from os.path import join
from typing import Optional, List, Union
import numpy as np
import pandas
import pandas as pd
from pydantic import BaseModel
from Backend import Constantes
from Backend.Auxiliares import auxiliar_ficheros, Extractor, auxiliaresCalculos
from Backend.GuardarCargarDatos import GuardarCargarMatrices
from Backend.OperacionesDeltas.SimuladorDeltasEstadistico import SimuladorDeltasEstadistico
from Backend.Manipuladores import Agrupador
from Backend.Manipuladores.Filtrador import Filtrador
from Backend.Representacion.ManejadorMapas.Manejar_Desplazamientos import Manejar_Desplazamientos
from Backend.Representacion.Mapas.MapaDensidad import MapaDensidad2
from Backend.Representacion.ManejadorMapas.manejar_Voronoi import manejar_Voronoi
from Backend.Representacion.ManejadorMapas.manejar_mapaCirculos import manejar_mapaCirculos
from Backend.estadisticasOcupacionHorarias import estadisticasOcupacionHorarias
from bike_simulator5 import bike_simulator5


def parse_mapa_spec(spec: str) -> tuple[list[int], list[int] | None, bool]:
    """
    spec: "0;10;20+1;15;26-L" o "0;1;2" o "0;1;2-L" o "0;1;2+3;4"
    return: (instantes, estaciones or None, labels_abiertos)
    """
    if not spec:
        return [], None, False

    labels = False
    if spec.endswith("-L"):
        labels = True
        spec = spec[:-2]

    if "+" in spec:
        inst_str, est_str = spec.split("+", 1)
        estaciones = [int(x) for x in est_str.split(";") if x.strip()]
    else:
        inst_str = spec
        estaciones = None

    instantes = [int(x) for x in inst_str.split(";") if x.strip()]

    return instantes, estaciones, labels


def _ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


def _basename_no_ext(path_png: str) -> str:
    root, _ = os.path.splitext(path_png)
    return root


def write_series_csv(base: str, x, ys: dict, meta: dict):
    base_path = Path(base)
    parent = base_path.parent
    original_name = base_path.name

    short_root = "Grafica"
    if "Grafica" in original_name:
        prefix = original_name.split("Grafica", 1)[0] + "Grafica"
    else:
        prefix = original_name[:40]

    h = hashlib.sha1(original_name.encode("utf-8")).hexdigest()[:8]
    safe_name = f"{prefix}_{h}.csv"
    out_path = parent / safe_name

    data = {"x": x}
    for name, values in ys.items():
        data[name] = values
    df = pd.DataFrame(data)

    df.to_csv(out_path, index=False)


def _hour_index(n_cols: int):
    return list(range(n_cols))


def __obtenerOperador(string: str):
    if ">=" in string:
        return operator.ge, string.replace(">=", ""), "MAYIGUAL"
    if "<=" in string:
        return operator.le, string.replace("<=", ""), "MENIGUAL"
    if ">" in string:
        return operator.gt, string.replace(">", ""), "MAY"
    if "<" in string:
        return operator.lt, string.replace("<", ""), "MAY"
    return operator.ge, string.replace(">=", ""), "MAYIGUAL"


# Para el grafico de lineas, hay que definir los dias para cada estacion, 87;212;all#all todos los dias para ambas estaciones
class StationDays(BaseModel):
    station_id: int
    days: Union[str, List[int]]


# Modelo del analysis con lo que pide sea para mapa, graph o filtro
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


class SimulateArgs(BaseModel):
    ruta_entrada: str
    ruta_salida: Optional[str] = None
    stress_type: int
    stress: float
    walk_cost: float
    delta: int
    dias: Optional[List[int]] = None
    simname: Optional[str] = None


def run_filter_only(
        input_folder: str,
        output_folder: str,
        filtro: str,
        tipo_filtro: str,
        seleccion: str,
) -> Path:
    args = AnalysisArgs(
        input_folder=input_folder,
        output_folder=output_folder,
        seleccion_agregacion=seleccion,
        delta_media=None,
        delta_acumulada=None,
        graf_barras_est_med=None,
        graf_barras_est_acum=None,
        graf_barras_dia=None,
        graf_linea_comp_est=None,
        graf_linea_comp_mats=None,
        mapa_densidad=None,
        video_densidad=None,
        mapa_voronoi=None,
        mapa_circulo=None,
        mapa_desplazamientos=None,
        filtrado_EstValor=None,
        filtrado_EstValorDias=None,
        filtrado_Horas=None,
        filtrado_PorcentajeEstaciones=None,
        filtro=filtro,
        tipo_filtro=tipo_filtro,
        use_filter_for_maps=False,
        filter_result_filename=None,
    )

    run_analysis(args)

    out_dir = Path(output_folder)
    pattern = "Filtrado_Estaciones"
    candidates = sorted(out_dir.glob(f"*{pattern}*.csv"))
    if not candidates:
        candidates = sorted(out_dir.glob(f"*{pattern}*.txt"))
    if not candidates:
        raise HTTPException(
            status_code=400,
            detail="No se ha encontrado el fichero de estaciones filtradas",
        )
    return candidates[-1]


def load_stations_from_file(path: Path) -> List[int]:
    """
    Lee un fichero de estaciones filtradas y devuelve lista de IDs (int).
    """
    text = path.read_text(encoding="utf-8")
    text = text.replace(",", ";")
    tokens = [t.strip() for t in text.split(";") if t.strip()]
    stations: List[int] = []
    for t in tokens:
        try:
            stations.append(int(t))
        except ValueError:
            continue
    return stations


def run_full_analysis(
        *,
        input_folder: str,
        output_folder: str,
        seleccion_agregacion: str,
        delta_media: Optional[int],
        delta_acumulada: Optional[int],
        mapa_densidad: Optional[str],
        video_densidad: Optional[str],
        mapa_voronoi: Optional[str],
        mapa_circulo: Optional[str],
        mapa_desplazamientos: Optional[str],
        filtro: Optional[str],
        tipo_filtro: Optional[str],
        filtrado_EstValor: Optional[str],
        filtrado_EstValorDias: Optional[str],
        filtrado_Horas: Optional[str],
        filtrado_PorcentajeEstaciones: Optional[str],
) -> dict:
    args = AnalysisArgs(
        input_folder=input_folder,
        output_folder=output_folder,
        seleccion_agregacion=seleccion_agregacion,
        delta_media=delta_media,
        delta_acumulada=delta_acumulada,
        graf_barras_est_med=None,
        graf_barras_est_acum=None,
        graf_barras_dia=None,
        graf_linea_comp_est=None,
        graf_linea_comp_mats=None,
        mapa_densidad=mapa_densidad,
        video_densidad=video_densidad,
        mapa_voronoi=mapa_voronoi,
        mapa_circulo=mapa_circulo,
        mapa_desplazamientos=mapa_desplazamientos,
        filtrado_EstValor=filtrado_EstValor,
        filtrado_EstValorDias=filtrado_EstValorDias,
        filtrado_Horas=filtrado_Horas,
        filtrado_PorcentajeEstaciones=filtrado_PorcentajeEstaciones,
        filtro=filtro,
        tipo_filtro=tipo_filtro,
        use_filter_for_maps=False,
        filter_result_filename=None,
    )
    return run_analysis(args)


def run_simulation(
        ruta_entrada: str,
        ruta_salida: str,
        stress_type: int,
        stress: float,
        walk_cost: float,
        delta: int,
        dias: Optional[List[int]] = None,
):
    """
    High-level simulation used by API.
    """
    Constantes.DELTA_TIME = delta
    Constantes.COSTE_ANDAR = walk_cost
    Constantes.PORCENTAJE_ESTRES = stress
    Constantes.RUTA_SALIDA = ruta_salida

    ficheros, ficheros_distancia = GuardarCargarMatrices.cargarDatosParaSimular(ruta_entrada)
    archivoCapacidad = auxiliar_ficheros.buscar_archivosEntrada(ruta_entrada, ["capacidades"])[0]
    pd.read_csv(archivoCapacidad).to_csv("capacidades.csv", index=False)

    if dias is not None and len(dias) > 0:
        path_fichero = join(
            ruta_salida,
            auxiliar_ficheros.formatoArchivo(f"Extraccion_{dias}", "csv"),
        )
        Extractor.extraerDias(
            ficheros[0],
            delta,
            dias,
            path_fichero,
            mantenerPrimeraFila=True,
        )
        ficheros[0] = path_fichero

    if stress > 0:
        ficheroDelta_salidaStress = join(
            ruta_salida, auxiliar_ficheros.formatoArchivo("Dstress", "csv")
        )
        Extractor.extraerStressAplicado(
            ficheros[0],
            ficheroDelta_salidaStress,
            stress,
            tipoStress=stress_type,
            listaEstaciones="All",
        )

        ficheroTendencias_salidaStress = join(
            ruta_salida, auxiliar_ficheros.formatoArchivo("Tendencias_stress", "csv")
        )
        Extractor.extraerStressAplicado(
            ficheros[5],
            ficheroTendencias_salidaStress,
            stress,
            tipoStress=stress_type,
            listaEstaciones="All",
        )

        ficheros[0] = ficheroDelta_salidaStress
        ficheros[5] = ficheroTendencias_salidaStress

    bs = bike_simulator5()
    nearest_stations_idx, nearest_stations_distance, initial_movements, real_movements, capacidadInicial, coordenadas = bs.load_data(
        directorios=ficheros,
        directorios_DiastanciasAndarBicicleta=ficheros_distancia,
    )
    coste, matricesSalida = bs.evaluate_solution(
        capacidadInicial,
        initial_movements,
        real_movements,
        nearest_stations_idx,
        nearest_stations_distance,
    )
    resumen = auxiliar_ficheros.hacerResumenMatricesSalida(matricesSalida)

    auxiliar_ficheros.guardarMatricesEnFicheros(matricesSalida, resumen, Constantes.RUTA_SALIDA)
    pd.DataFrame(Constantes.COORDENADAS).to_csv(
        join(Constantes.RUTA_SALIDA, "coordenadas.csv"), index=False
    )
    pd.read_csv(archivoCapacidad).to_csv(join(ruta_salida, "capacidades.csv"), index=False)


def run_simulador_estadistico(
        ruta_deltas: str,
        ruta_salida: str,
        delta_actual: int,
        dias_a_simular: int,
        ruleta: int,
):
    Constantes.RUTA_SALIDA = ruta_salida
    Constantes.DELTA_TIME = delta_actual
    rutaDeltas = auxiliar_ficheros.buscar_archivosEntrada(ruta_deltas, ['deltas'])

    matrizDeltas = pd.read_csv(rutaDeltas[0])
    simuladorDE = SimuladorDeltasEstadistico(matrizDeltas, int(delta_actual))

    if int(ruleta) == 1:
        nuevoFicheroDeltas = simuladorDE.simularDatosEstadisticos_PeriodoTotal(int(dias_a_simular))
    else:
        dias = list(range(0, int(dias_a_simular)))
        nuevoFicheroDeltas = simuladorDE.simularDatosEstadisticos_Horas(dias)

    nombre = auxiliar_ficheros.formatoArchivo("deltasGeneradosEstadistica", "csv")
    nuevoFicheroDeltas.to_csv(join(ruta_salida, nombre), index=False)


def run_restar_directorios(
        ruta_directorio1: str,
        ruta_directorio2: str,
        ruta_directorio_salida: str,
):
    print(
        "Restando las matrices del directorio "
        + str(ruta_directorio1)
        + " menos las matrices del directorio "
        + str(ruta_directorio2)
    )

    directorios_resta = [
        Constantes.OCUPACION,
        Constantes.OCUPACION_RELATIVA,
        Constantes.PETICIONES_RESUELTAS_COGER_BICI,
        Constantes.PETICIONES_RESUELTAS_SOLTAR_BICI,
        Constantes.PETICIONES_RESUELTAS_FICTICIAS_COGER_BICI,
        Constantes.PETICIONES_RESUELTAS_FICTICIAS_DEJAR_BICI,
        Constantes.PETICIONES_NORESUELTAS_COGER_BICI,
        Constantes.PETICIONES_NORESUELTAS_SOLTAR_BICI,
        Constantes.PETICIONES_NORESUELTAS_FICTICIAS_COGER_BICI,
        Constantes.PETICIONES_NORESUELTAS_FICTICIAS_DEJAR_BICI,
        Constantes.KMS_COGER_BICI,
        Constantes.KMS_DEJAR_BICI,
        Constantes.KMS_FICTICIOS_COGER,
        Constantes.KMS_FICTICIOS_DEJAR,
    ]

    restoFicheros = auxiliar_ficheros.buscar_archivosEntrada(
        ruta_directorio1, ['Desplazamientos', 'coordenadas']
    )
    resumen1 = auxiliar_ficheros.buscar_archivosEntrada(ruta_directorio1, ['ResumenEjecucion'])
    resumen2 = auxiliar_ficheros.buscar_archivosEntrada(ruta_directorio2, ['ResumenEjecucion'])
    shutil.copy(restoFicheros[0], join(ruta_directorio_salida, 'Desplazamientos.csv'))
    shutil.copy(restoFicheros[1], join(ruta_directorio_salida, 'coordenadas.csv'))

    with open(resumen1[0], "r") as archivo:
        contenido1 = archivo.read()
    contenido_archivoResumen1 = contenido1.split(",")

    with open(resumen2[0], "r") as archivo:
        contenido2 = archivo.read()
    contenido_archivoResumen2 = contenido2.split(",")

    diferenciaResumenes = (
            np.array(list(map(float, contenido_archivoResumen1)))[2:]
            - np.array(list(map(float, contenido_archivoResumen2)))[2:]
    ).tolist()
    resumenDiferencia = str((list(map(float, contenido_archivoResumen1)))[:2] + diferenciaResumenes)[1:-1]

    with open(join(ruta_directorio_salida, 'DIFERENCIA_ResumenEjecucion.txt'), "w") as archivo:
        archivo.write(resumenDiferencia)

    capacidades1 = auxiliar_ficheros.buscar_archivosEntrada(ruta_directorio1, ['capacidades'])
    capacidades2 = auxiliar_ficheros.buscar_archivosEntrada(ruta_directorio2, ['capacidades'])

    if capacidades1 != [] and capacidades2 != []:
        nombre = auxiliar_ficheros.formatoArchivo("DIFERENCIA_CAPACIDADES", "csv")
        (pd.read_csv(capacidades1[0]) - pd.read_csv(capacidades2[0])).transpose().to_csv(
            join(ruta_directorio_salida, nombre), index=False
        )

    for archivo in directorios_resta:
        fichero1 = auxiliar_ficheros.buscar_archivosEntrada(ruta_directorio1, [archivo])
        fichero2 = auxiliar_ficheros.buscar_archivosEntrada(ruta_directorio2, [archivo])
        matriz1 = pd.read_csv(fichero1[0])
        matriz2 = pd.read_csv(fichero2[0])
        archivoResultante = Agrupador.sustraerMatrices(matriz1, matriz2)
        nombre = auxiliar_ficheros.formatoArchivo("DIFERENCIA " + archivo, "csv")
        archivoResultante.to_csv(join(ruta_directorio_salida, nombre), index=False)

