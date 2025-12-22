from __future__ import annotations

import math
import operator
import os
import json
import shutil
from os.path import join
from typing import Optional, List

import numpy as np
import pandas as pd
from matplotlib.pyplot import clf
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


# -------------------------
# Helpers
# -------------------------

def _ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


def _basename_no_ext(path_png: str) -> str:
    root, _ = os.path.splitext(path_png)
    return root


def write_series_csv(path_png: str, x, ys: dict, meta: dict = None):
    base = _basename_no_ext(path_png)
    dir_out = os.path.dirname(base)
    _ensure_dir(dir_out)
    df = pd.DataFrame({"x": x, **ys})
    df.to_csv(base + ".csv", index=False)
    if meta:
        with open(base + ".meta.json", "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False)


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


# =========================
# Pydantic models for API
# =========================

class AnalysisArgs(BaseModel):
    input_folder: str
    output_folder: str
    seleccion_agregacion: str

    delta_media: Optional[int] = 60
    delta_acumulada: Optional[int] = None

    graf_barras_est_med: Optional[str] = None      # "estacion-dias" -> "1-all"
    graf_barras_est_acum: Optional[str] = None
    graf_barras_dia: Optional[str] = None          # "all-M-Frec"
    graf_linea_comp_est: Optional[str] = None
    graf_linea_comp_mats: Optional[str] = None

    mapa_densidad: Optional[str] = None
    video_densidad: Optional[str] = None
    mapa_voronoi: Optional[str] = None
    mapa_circulo: Optional[str] = None
    mapa_desplazamientos: Optional[str] = None

    filtrado_EstValor: Optional[str] = None        # ">=65;20;all;5"
    filtrado_EstValorDias: Optional[str] = None
    filtrado_Horas: Optional[str] = None
    filtrado_PorcentajeEstaciones: Optional[str] = None

class SimulateArgs(BaseModel):
    ruta_entrada: str
    ruta_salida: str
    stress_type: int
    stress: float
    walk_cost: float
    delta: int
    dias: Optional[List[int]] = None
# =========================
# Simulation entry points
# =========================

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


# =========================
# Analysis (no comando)
# =========================

def run_analysis(args: AnalysisArgs) -> dict:
    charts: list[dict] = []

    pathEntrada = args.input_folder
    pathSalida = args.output_folder
    seleccionAgregacion_matriz = args.seleccion_agregacion

    deltaDeseado_media = args.delta_media
    deltaDeseado_acumulado = args.delta_acumulada

    histograma_medio_estacion = args.graf_barras_est_med
    histograma_acumulado_estacion = args.graf_barras_est_acum
    histograma_dia = args.graf_barras_dia
    histograma_comparar_estaciones = args.graf_linea_comp_est
    histograma_comparar_matrices = args.graf_linea_comp_mats

    mapa_densidad = args.mapa_densidad
    mapa_densidad_video = args.video_densidad
    mapa_voronoi = args.mapa_voronoi
    mapa_circulo = args.mapa_circulo
    mapa_desplazamientos = args.mapa_desplazamientos

    filtrado_EstSuperiorValor = args.filtrado_EstValor
    filtrado_EstSuperiorValorDias = args.filtrado_EstValorDias
    filtrado_HorasSuperiorValor = args.filtrado_Horas
    filtrado_PorcentajeHoraEstacionMasValor = args.filtrado_PorcentajeEstaciones

    matrices, resumentxt = GuardarCargarMatrices.cargarSimulacionesParaAnalisis(pathEntrada)

    Constantes.DELTA_TIME = float(resumentxt[0])
    Constantes.PORCENTAJE_ESTRES = float(resumentxt[1])
    Constantes.COSTE_ANDAR = float(resumentxt[2])
    Constantes.RUTA_SALIDA = pathSalida

    # Selección/agregación de matrices
    operacion = 1
    if seleccionAgregacion_matriz and '(-)' in seleccionAgregacion_matriz:
        seleccionAgregacion_matriz = seleccionAgregacion_matriz.split(')')[1]
        operacion = -1

    id_matrices = list(map(int, seleccionAgregacion_matriz.split(";")))
    listaMatrices = Constantes.LISTA_MATRICES

    if Constantes.MATRIZ_CUSTOM is None or -1 not in id_matrices:
        matrizDeseada = matrices[listaMatrices[id_matrices[0]]].matrix
        inicio = 1
    else:
        matrizDeseada = Constantes.MATRIZ_CUSTOM.matrix
        inicio = 0

    if len(id_matrices) > 1:
        for i in range(inicio, len(id_matrices)):
            if id_matrices[i] != -1:
                matrizAsumar = matrices[listaMatrices[id_matrices[i]]].matrix
                if operacion == 1:
                    matrizDeseada = Agrupador.agruparMatrices(matrizDeseada, matrizAsumar)
                else:
                    matrizDeseada = Agrupador.sustraerMatrices(matrizDeseada, matrizAsumar)

    matrizDeseada = auxiliaresCalculos.rellenarFilasMatrizDeseada(
        matrizDeseada,
        matrices[Constantes.OCUPACION].matrix.shape[0] - 1,
    )

    # Conversión de deltas
    if deltaDeseado_media is not None:
        matrizDeseada = Agrupador.colapsarDeltasMedia(
            matrizDeseada, Constantes.DELTA_TIME, deltaDeseado_media
        )
        Constantes.DELTA_TIME = deltaDeseado_media

    if deltaDeseado_acumulado is not None:
        matrizDeseada = Agrupador.colapsarDeltasAcumulacion(
            matrizDeseada, Constantes.DELTA_TIME, deltaDeseado_acumulado
        )
        Constantes.DELTA_TIME = deltaDeseado_acumulado

    diasMatrizDeseada = int(matrizDeseada.shape[0] / 24)
    nombre = auxiliar_ficheros.formatoArchivo("ficheroMatrizDeseada", "csv")
    matrizDeseada.to_csv(join(Constantes.RUTA_SALIDA, nombre), index=False)

    filtrador = Filtrador(matrizDeseada, Constantes.DELTA_TIME)
    eoc = estadisticasOcupacionHorarias(matrizDeseada, Constantes.DELTA_TIME)

    # Histogramas
    if histograma_medio_estacion:
        aux_cadena = histograma_medio_estacion.split("-")
        titulo = auxiliar_ficheros.formatoArchivo("GraficaMedia_Estacion" + str(aux_cadena[0]), "png")

        if aux_cadena[1] == 'all':
            dias = list(range(diasMatrizDeseada))
        else:
            dias = list(map(int, aux_cadena[1].split(";")))

        eoc.HistogramaPorEstacion(int(aux_cadena[0]), dias, nombreGrafica=titulo)

        x = _hour_index(matrizDeseada.shape[1])
        idx = [h + d * 24 for d in dias for h in range(24)]
        serie = matrizDeseada.iloc[idx, :].mean(axis=0).tolist()
        meta = {
            "type": "bar",
            "title": "Media Estación " + aux_cadena[0],
            "xLabel": "Hora",
            "yLabel": "Media",
        }

        write_series_csv(
            join(Constantes.RUTA_SALIDA, titulo),
            x=x,
            ys={"mean": serie},
            meta=meta,
        )

        charts.append({
            "id": "GraficaMedia_Estacion" + str(aux_cadena[0]),
            "kind": "graph",
            "format": "json",
            "x": x,
            "series": {"mean": serie},
            "meta": meta,
        })

    clf()
    if histograma_acumulado_estacion:
        aux_cadena = histograma_acumulado_estacion.split("-")
        titulo = auxiliar_ficheros.formatoArchivo("GraficaAcumulado_Estacion" + str(aux_cadena[0]), "png")
        if aux_cadena[1] == 'all':
            dias = list(range(diasMatrizDeseada))
        else:
            dias = list(map(int, aux_cadena[1].split(";")))
        eoc.HistogramaAcumulacion(int(aux_cadena[0]), dias, titulo)

        x = _hour_index(matrizDeseada.shape[1])
        idx = [h + d * 24 for d in dias for h in range(24)]
        values = matrizDeseada.iloc[idx, :].sum(axis=0).cumsum().tolist()
        meta = {
            "type": "line",
            "title": "Acumulado Estación " + aux_cadena[0],
            "xLabel": "Hora",
            "yLabel": "Acumulado",
        }

        write_series_csv(
            join(Constantes.RUTA_SALIDA, titulo),
            x=x,
            ys={"cum": values},
            meta=meta,
        )

        charts.append({
            "id": "GraficaAcumulado_Estacion" + str(aux_cadena[0]),
            "kind": "graph",
            "format": "json",
            "x": x,
            "series": {"cum": values},
            "meta": meta,
        })

    clf()
    if histograma_dia:
        caracter_media = histograma_dia.split('-')[1]
        media = (caracter_media == 'M')

        frecuencia = False
        if 'Frec' in histograma_dia:
            histograma_dia = histograma_dia.split('-')[0]
            frecuencia = True

        if "all" in histograma_dia:
            dias = list(range(0, int(matrizDeseada.shape[0] / 24)))
        else:
            dias = list(map(int, histograma_dia.split(";")))

        titulo = auxiliar_ficheros.formatoArchivo("Grafica_Dias_" + str(dias), "png")
        eoc.HistogramaOcupacionMedia(dias, frecuencia=frecuencia, media=media)

        slice_idx = [h + d * 24 for d in dias for h in range(24)]
        base_vals = (
            matrizDeseada.iloc[slice_idx, :].mean(axis=0).to_numpy()
            if media
            else matrizDeseada.iloc[slice_idx, :].sum(axis=0).to_numpy()
        )

        if frecuencia:
            bin_count = 20
            vmin, vmax = float(base_vals.min()), float(base_vals.max())
            bins = np.linspace(vmin, vmax, bin_count + 1)
            counts, edges = np.histogram(base_vals, bins=bins)
            centers = (edges[:-1] + edges[1:]) / 2.0
            x = centers.tolist()
            vals = counts.tolist()
            meta = {
                "type": "bar",
                "title": "Días " + str(dias),
                "xLabel": "Valor",
                "yLabel": "Frecuencia",
                "freq": True,
                "media": media,
            }
        else:
            x = _hour_index(matrizDeseada.shape[1])
            vals = base_vals.tolist()
            meta = {
                "type": "line",
                "title": "Días " + str(dias),
                "xLabel": "Hora",
                "yLabel": "Valor",
                "freq": False,
                "media": media,
            }

        write_series_csv(
            join(Constantes.RUTA_SALIDA, titulo),
            x=x,
            ys={"value": vals},
            meta=meta,
        )
        charts.append({
            "id": "Grafica_Dias_" + str(dias),
            "kind": "graph",
            "format": "json",
            "x": x,
            "series": {"value": vals},
            "meta": meta,
        })

    # Comparar matrices (si tienes MATRIZ_CUSTOM)
    if histograma_comparar_matrices and Constantes.MATRIZ_CUSTOM is not None:
        cadenas = histograma_comparar_matrices.split("-")
        deltaMatriz = int(cadenas[0])
        estaciones1 = list(map(int, cadenas[1].split(";")))
        estaciones2 = list(map(int, cadenas[2].split(";")))
        media = cadenas[3] == 'M'

        eoc2 = estadisticasOcupacionHorarias(matrizDeseada, Constantes.DELTA_TIME)
        titulo = auxiliar_ficheros.formatoArchivo("Grafica_CompararMatrices_", "png")
        eoc2.HistogramaCompararMatrices(
            Constantes.MATRIZ_CUSTOM.matrix,
            deltaMatriz,
            estaciones1,
            estaciones2,
            media=media,
            nombreGrafica=titulo,
        )

        x = _hour_index(matrizDeseada.shape[1])
        ys = {
            "current": matrizDeseada.mean(axis=0).tolist(),
            "custom": Constantes.MATRIZ_CUSTOM.matrix.mean(axis=0).tolist(),
        }
        write_series_csv(
            join(Constantes.RUTA_SALIDA, titulo),
            x=x,
            ys=ys,
            meta={
                "type": "line",
                "title": "Comparar matrices",
                "xLabel": "Hora",
                "yLabel": "Media",
                "delta": deltaMatriz,
                "media": media,
            },
        )
        charts.append({
            "id": "Grafica_CompararMatrices_",
            "kind": "graph",
            "format": "json",
            "x": x,
            "series": ys,
            "meta": {
                "type": "line",
                "title": "Comparar matrices",
                "xLabel": "Hora",
                "yLabel": "Media",
                "delta": deltaMatriz,
                "media": media,
            },
        })

    # Mapas: ejemplo solo para densidad puntual y video; puedes añadir voronoi/círculos igual que en tu código original.

    if mapa_densidad:
        if "+" in mapa_densidad:
            cadena = mapa_densidad.split("+")[0]
            estaciones = list(map(int, mapa_densidad.split("+")[1].split(";")))
        else:
            cadena = mapa_densidad
            estaciones = []

        mapas = list(map(int, cadena.split(";")))
        mapa = MapaDensidad2(Constantes.COORDENADAS)
        mapa.cargarDatos(matrizDeseada, lista_estaciones=estaciones)
        for mapa_representar in mapas:
            instante = int(mapa_representar)
            mapa.representarHeatmap(instante=instante)

            df_frame = pd.DataFrame({
                "station_id": np.arange(matrizDeseada.shape[1]),
                "t": instante,
                "value": matrizDeseada.iloc[instante, :].tolist(),
            })
            base_png = auxiliar_ficheros.formatoArchivo("Heatmap_instante" + str(instante), "png")
            df_frame.to_csv(join(Constantes.RUTA_SALIDA, base_png.replace(".png", ".csv")), index=False)
            charts.append({
                "id": f"Heatmap_instante{instante}",
                "kind": "heatmap",
                "format": "json",
                "t": instante,
                "stations": np.arange(matrizDeseada.shape[1]).tolist(),
                "values": matrizDeseada.iloc[instante, :].tolist(),
            })

    if mapa_densidad_video:
        if "+" in mapa_densidad_video:
            momentos = mapa_densidad_video.split("+")[0]
            estaciones = list(map(int, mapa_densidad_video.split("+")[1].split(";")))
            texto_estaciones = str(estaciones)
        else:
            momentos = mapa_densidad_video
            estaciones = []
            texto_estaciones = "TODAS"

        momentos_split = momentos.split(":")
        momentoInicio = int(momentos_split[0])
        if momentos_split[1] != "end":
            momentoFinal = int(momentos_split[1])
        else:
            momentoFinal = len(matrizDeseada) - 1

        mapa = MapaDensidad2(Constantes.COORDENADAS)
        mapa.cargarDatos(matrizDeseada, lista_estaciones=estaciones)
        nombre_video = auxiliar_ficheros.formatoArchivo(
            "video_densidad" + str(momentoInicio) + "__" + str(momentoFinal) + "_" + texto_estaciones,
            "mp4",
        )
        mapa.realizarVideoHeatmap(momentoInicio, momentoFinal, rutaSalida=join(Constantes.RUTA_SALIDA, nombre_video))

        rows = []
        for t in range(momentoInicio, momentoFinal + 1):
            vals = matrizDeseada.iloc[t, :].tolist()
            for sid, v in enumerate(vals):
                rows.append((t, sid, v))
        df = pd.DataFrame(rows, columns=["t", "station_id", "value"])
        df.to_csv(join(Constantes.RUTA_SALIDA, nombre_video.replace(".mp4", ".csv")), index=False)

    # (Añade aquí mapa_voronoi, mapa_circulo, mapa_desplazamientos si los necesitas,
    # siguiendo tu código original, y añade a `charts` cuando tenga sentido.)

    return {"ok": True, "charts": charts}
