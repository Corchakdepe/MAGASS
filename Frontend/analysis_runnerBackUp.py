from __future__ import annotations
import pandas
from datetime import datetime
from pathlib import Path
from typing import Optional, List
import hashlib
import glob
import json
import os

import numpy as np
import pandas as pd
from fastapi import HTTPException
from os.path import join

from Backend import Constantes
from Backend.Auxiliares import auxiliar_ficheros, auxiliaresCalculos
from Backend.GuardarCargarDatos import GuardarCargarMatrices
from Backend.Manipuladores import Agrupador
from Backend.Manipuladores.Filtrador import Filtrador
from Backend.Representacion.ManejadorMapas.Manejar_Desplazamientos import Manejar_Desplazamientos
from Backend.Representacion.Mapas.MapaDensidad import MapaDensidad2
from Backend.Representacion.ManejadorMapas.manejar_Voronoi import manejar_Voronoi
from Backend.Representacion.ManejadorMapas.manejar_mapaCirculos import manejar_mapaCirculos
from Backend.estadisticasOcupacionHorarias import estadisticasOcupacionHorarias
from Backend.Representacion.ChartBuilder import ChartBuilder, create_chart_json

from Frontend.analysis_models import AnalysisArgs
from Frontend.chart_utils import write_series_csv
from Frontend.map_utils import _sync_html_name_with_png, parse_mapa_spec, write_map_sidecar
from Frontend.EjecutadorCMD import __obtenerOperador

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


def run_analysis(args: AnalysisArgs) -> dict:
    charts: list[dict] = []

    if getattr(args, "filtro", None) and getattr(args, "tipo_filtro", None) and args.filtro != "_":
        tf = args.tipo_filtro
        if tf in ("EstValor", "EstValorDias"):
            args.filtrado_EstValorDias = args.filtro
        elif tf == "Horas":
            args.filtrado_Horas = args.filtro
        elif tf == "Porcentaje":
            args.filtrado_PorcentajeEstaciones = args.filtro

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

    # ===========================
    # Cargar simulaciones
    # ===========================
    matrices, resumentxt = GuardarCargarMatrices.cargarSimulacionesParaAnalisis(pathEntrada)

    Constantes.DELTA_TIME = float(resumentxt[0])
    Constantes.PORCENTAJE_ESTRES = float(resumentxt[1])
    Constantes.COSTE_ANDAR = float(resumentxt[2])
    Constantes.RUTA_SALIDA = pathSalida

    # ---------------------------
    # Selección / agregación
    # ---------------------------
    operacion = 1
    if seleccionAgregacion_matriz and "(-)" in seleccionAgregacion_matriz:
        seleccionAgregacion_matriz = seleccionAgregacion_matriz.split(")")[1]
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
    maps_json: list[dict] = []
    # ---------------------------
    # Conversión de deltas
    # ---------------------------
    if deltaDeseado_media is not None:
        matrizDeseada = Agrupador.colapsarDeltasMedia(
            matrizDeseada, Constantes.DELTA_TIME, deltaDeseado_media
        )
        Constantes.DELTA_TIME = int(deltaDeseado_media)

    if deltaDeseado_acumulado is not None:
        matrizDeseada = Agrupador.colapsarDeltasAcumulacion(
            matrizDeseada, Constantes.DELTA_TIME, deltaDeseado_acumulado
        )
        Constantes.DELTA_TIME = int(deltaDeseado_acumulado)

    diasMatrizDeseada = int(matrizDeseada.shape[0] / 24)
    nombre = auxiliar_ficheros.formatoArchivo("ficheroMatrizDeseada", "csv")
    matrizDeseada.to_csv(join(Constantes.RUTA_SALIDA, nombre), index=False)

    filtrador = Filtrador(matrizDeseada, Constantes.DELTA_TIME)
    Constantes.DELTA_TIME = int(Constantes.DELTA_TIME)
    eoc = estadisticasOcupacionHorarias(matrizDeseada, Constantes.DELTA_TIME)

    # ===========================
    # IMPORTS (add to top of file)
    # ===========================
    from Backend.Representacion.ChartBuilder import ChartBuilder
    import hashlib
    from pathlib import Path
    from datetime import datetime

    # ===========================
    # 1) Histogramas por estación - MEDIA
    # ===========================
    if histograma_medio_estacion:
        # spec: "est" o "est1;est2;...-dias"
        aux_cadena = histograma_medio_estacion.split("-")
        if len(aux_cadena) < 2:
            raise ValueError(
                f"Cadena graf_barras_est_med inválida: {histograma_medio_estacion}"
            )

        ests_str = aux_cadena[0]  # "87" o "87;212"
        dias_str = aux_cadena[1]  # "all" o "8;9;10;11;12"

        estaciones_ids = [int(s) for s in ests_str.split(";") if s.strip()]
        if not estaciones_ids:
            raise ValueError(
                f"graf_barras_est_med sin estaciones: {histograma_medio_estacion}"
            )

        if dias_str == "all":
            dias = list(range(diasMatrizDeseada))
        else:
            dias = list(map(int, dias_str.split(";")))

        # Calculate data - horas 0..23
        x = list(range(24))
        idx = [h + d * 24 for d in dias for h in range(24)]
        hora_index = [h for d in dias for h in range(24)]

        series_data = {}
        for est_id in estaciones_ids:
            # media por HORA en esa estación
            serie = (
                pandas.Series(matrizDeseada.iloc[idx, est_id].values)
                .groupby(hora_index)
                .mean()
                .reindex(x)
                .tolist()
            )
            series_data[f"est_{est_id}"] = serie

        # Generate filename with timestamp and hash
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = f"GraficaMedia_Estaciones_{'_'.join(map(str, estaciones_ids))}"
        content_hash = hashlib.sha1(base_name.encode('utf-8')).hexdigest()[:8]
        json_filename = f"{timestamp}_Grafica_{content_hash}.json"
        json_path = Path(Constantes.RUTA_SALIDA) / json_filename

        # Create standardized chart using ChartBuilder
        chart_json = ChartBuilder.create_timeseries_chart(
            title=f"Mean Occupancy: Stations {estaciones_ids}",
            x_hours=x,
            series_data=series_data,
            stations=estaciones_ids,
            days=dias,
            aggregation="mean",
            output_path=str(json_path)
        )

        # Add to response
        charts.append(chart_json)

        # Also write CSV for backward compatibility (optional)
        titulo_csv = auxiliar_ficheros.formatoArchivo(
            f"GraficaMedia_Estaciones_{','.join(map(str, estaciones_ids))}",
            "png",
        )
        meta_csv = {
            "type": "bar",
            "title": f"Media Estaciones {estaciones_ids}",
            "xLabel": "Hora",
            "yLabel": "Media",
            "multiStation": True,
            "stations": estaciones_ids,
            "dias": dias,
        }
        write_series_csv(
            join(Constantes.RUTA_SALIDA, titulo_csv),
            x=x,
            ys={f"Est_{est_id}": series_data[f"est_{est_id}"] for est_id in estaciones_ids},
            meta=meta_csv,
        )

    # ===========================
    # 2) Histogramas por estación - ACUMULADO
    # ===========================
    if histograma_acumulado_estacion:
        aux_cadena = histograma_acumulado_estacion.split("-")
        if len(aux_cadena) < 2:
            raise ValueError(
                f"Cadena graf_barras_est_acum inválida: {histograma_acumulado_estacion}"
            )

        ests_str = aux_cadena[0]  # "87" o "87;212"
        dias_str = aux_cadena[1]  # "all" o "8;9;10;11;12"

        estaciones_ids = [int(s) for s in ests_str.split(";") if s.strip()]
        if not estaciones_ids:
            raise ValueError(
                f"graf_barras_est_acum sin estaciones: {histograma_acumulado_estacion}"
            )

        if dias_str == "all":
            dias = list(range(diasMatrizDeseada))
        else:
            dias = list(map(int, dias_str.split(";")))

        # Calculate cumulative data
        x = list(range(24))
        idx = [h + d * 24 for d in dias for h in range(24)]
        hora_index = [h for d in dias for h in range(24)]

        series_data = {}
        for est_id in estaciones_ids:
            # suma por hora y acumulado
            values = (
                pandas.Series(matrizDeseada.iloc[idx, est_id].values)
                .groupby(hora_index)
                .sum()
                .reindex(x)
                .cumsum()
                .tolist()
            )
            series_data[f"est_{est_id}"] = values

        # Generate filename with timestamp and hash
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = f"GraficaAcumulado_Estaciones_{'_'.join(map(str, estaciones_ids))}"
        content_hash = hashlib.sha1(base_name.encode('utf-8')).hexdigest()[:8]
        json_filename = f"{timestamp}_Grafica_{content_hash}.json"
        json_path = Path(Constantes.RUTA_SALIDA) / json_filename

        # Create standardized chart using ChartBuilder
        chart_json = ChartBuilder.create_accumulation_chart(
            title=f"Cumulative Occupancy: Stations {estaciones_ids}",
            x_hours=x,
            series_data=series_data,
            stations=estaciones_ids,
            days=dias,
            output_path=str(json_path)
        )

        # Add to response
        charts.append(chart_json)

        # Also write CSV for backward compatibility (optional)
        titulo_csv = auxiliar_ficheros.formatoArchivo(
            f"GraficaAcumulado_Estaciones_{','.join(map(str, estaciones_ids))}",
            "png",
        )
        meta_csv = {
            "type": "line",
            "title": f"Acumulado Estaciones {estaciones_ids}",
            "xLabel": "Hora",
            "yLabel": "Acumulado",
            "multiStation": True,
            "stations": estaciones_ids,
            "dias": dias,
        }
        write_series_csv(
            join(Constantes.RUTA_SALIDA, titulo_csv),
            x=x,
            ys={f"Est_{est_id}": series_data[f"est_{est_id}"] for est_id in estaciones_ids},
            meta=meta_csv,
        )

    # ===========================
    # 3) Gráfica Días (media/acum, opcional frecuencia)
    # ===========================
    if histograma_dia:
        # "dias-M", "dias-A", "dias-M-Frec", "dias-A-Frec"
        partes = histograma_dia.split("-")

        if len(partes) < 2:
            raise ValueError(f"Cadena graf_barras_dia inválida: {histograma_dia}")

        dias_str = partes[0]
        caracter_media = partes[1]  # "M" o "A"
        frecuencia = len(partes) >= 3 and partes[2] == "Frec"
        media_flag = caracter_media == "M"

        if dias_str == "all":
            dias = list(range(diasMatrizDeseada))
        else:
            dias = list(map(int, dias_str.split(";")))

        # Calculate base values
        idx = [h + d * 24 for d in dias for h in range(24)]

        base_vals = (
            matrizDeseada.iloc[idx, :].mean(axis=0).to_numpy()
            if media_flag
            else matrizDeseada.iloc[idx, :].sum(axis=0).to_numpy()
        )

        # Generate filename with timestamp and hash
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        dias_repr = "_".join(map(str, dias[:5])) if len(dias) <= 5 else f"all_{len(dias)}"

        if frecuencia:
            # DISTRIBUTION CHART: histograma de frecuencias sobre valores
            bin_count = 20
            vmin, vmax = float(base_vals.min()), float(base_vals.max())

            # Avoid division by zero if all values are the same
            if vmin == vmax:
                vmin -= 0.5
                vmax += 0.5

            bins = np.linspace(vmin, vmax, bin_count + 1)
            counts, edges = np.histogram(base_vals, bins=bins)
            centers = (edges[:-1] + edges[1:]) / 2.0

            base_name = f"GraficaDias_{dias_repr}_freq"
            content_hash = hashlib.sha1(base_name.encode('utf-8')).hexdigest()[:8]
            json_filename = f"{timestamp}_Grafica_{content_hash}.json"
            json_path = Path(Constantes.RUTA_SALIDA) / json_filename

            # Create distribution chart
            chart_json = ChartBuilder.create_distribution_chart(
                title=f"Distribution - Days {dias}",
                bin_centers=centers.tolist(),
                frequencies=counts.tolist(),
                days=dias,
                value_type="mean" if media_flag else "sum",
                output_path=str(json_path)
            )

            charts.append(chart_json)

            # CSV backward compatibility
            titulo_csv = auxiliar_ficheros.formatoArchivo(
                f"GraficaDias_{dias}", "png"
            )
            meta_csv = {
                "type": "bar",
                "title": f"Días {dias}",
                "xLabel": "Valor",
                "yLabel": "Frecuencia",
                "freq": True,
                "media": media_flag,
            }
            write_series_csv(
                join(Constantes.RUTA_SALIDA, titulo_csv),
                x=centers.tolist(),
                ys={"value": counts.tolist()},
                meta=meta_csv,
            )
        else:
            # STATION SERIES: Valores medios/acumulados POR ESTACIÓN (no por hora)
            x = list(range(len(base_vals)))  # índice de estación
            vals = base_vals.tolist()

            base_name = f"GraficaDias_{dias_repr}_stations"
            content_hash = hashlib.sha1(base_name.encode('utf-8')).hexdigest()[:8]
            json_filename = f"{timestamp}_Grafica_{content_hash}.json"
            json_path = Path(Constantes.RUTA_SALIDA) / json_filename

            # Create station series chart
            chart_json = {
                "id": f"station_values_days_{'_'.join(map(str, dias[:3]))}",
                "kind": "station_series",
                "format": "json",
                "visualization": {
                    "recommended": "line",
                    "supported": ["line", "bar"]
                },
                "data": {
                    "x": {
                        "values": x,
                        "label": "Station Index",
                        "type": "categorical",
                        "unit": "station_id"
                    },
                    "series": [{
                        "id": "value",
                        "label": "Mean" if media_flag else "Sum",
                        "values": vals,
                        "metadata": {
                            "derived": False,
                            "value_type": "mean" if media_flag else "sum"
                        }
                    }]
                },
                "context": {
                    "title": f"Station Values - Days {dias}",
                    "days": dias,
                    "value_type": "mean" if media_flag else "sum"
                }
            }

            # Save JSON
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(chart_json, f, ensure_ascii=False, indent=2)

            charts.append(chart_json)

            # CSV backward compatibility
            titulo_csv = auxiliar_ficheros.formatoArchivo(
                f"GraficaDias_{dias}", "png"
            )
            meta_csv = {
                "type": "line",
                "title": f"Días {dias}",
                "xLabel": "Estación",
                "yLabel": "Valor",
                "freq": False,
                "media": media_flag,
            }
            write_series_csv(
                join(Constantes.RUTA_SALIDA, titulo_csv),
                x=x,
                ys={"value": vals},
                meta=meta_csv,
            )

        # Call original eoc function if you still need image generation
        eoc.HistogramaOcupacionMedia(dias, frecuencia=frecuencia, media=media_flag)

    # ===========================
    # 4) Gráfica línea comparar estaciones
    # ===========================
    if histograma_comparar_estaciones:
        estaciones = [spec.station_id for spec in histograma_comparar_estaciones]

        x = list(range(24))
        series_specs = []

        for spec in histograma_comparar_estaciones:
            if spec.days == "all":
                dias = list(range(diasMatrizDeseada))
                dias_label = "all"
            else:
                dias = list(spec.days)
                dias_label = dias  # Will be formatted in ChartBuilder

            idx = [h + d * 24 for d in dias for h in range(24)]
            hora_index = [h for d in dias for h in range(24)]

            if not idx:
                serie = [None] * 24
            else:
                s = (
                    pandas.Series(matrizDeseada.iloc[idx, spec.station_id].values)
                    .groupby(hora_index)
                    .mean()
                )
                s = s.reindex(x)
                serie = s.tolist()

            series_specs.append({
                "station_id": spec.station_id,
                "days": dias_label,
                "values": serie,
                "aggregation": "mean"
            })

        # Generate filename with timestamp and hash
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = f"GraficaCompararEstaciones_{'_'.join(map(str, estaciones[:5]))}"
        content_hash = hashlib.sha1(base_name.encode('utf-8')).hexdigest()[:8]
        json_filename = f"{timestamp}_Grafica_{content_hash}.json"
        json_path = Path(Constantes.RUTA_SALIDA) / json_filename

        # Create comparison chart using ChartBuilder
        chart_json = ChartBuilder.create_comparison_chart(
            title=f"Compare Stations {estaciones}",
            x_hours=x,
            series_specs=series_specs,
            global_context={},
            output_path=str(json_path)
        )

        charts.append(chart_json)

        # CSV backward compatibility
        titulo_csv = auxiliar_ficheros.formatoArchivo(
            "Grafica_CompararEstaciones", "png"
        )
        series_csv = {}
        dias_repr = []
        for spec in histograma_comparar_estaciones:
            series_csv[f"est_{spec.station_id}"] = series_specs[
                [s["station_id"] for s in series_specs].index(spec.station_id)
            ]["values"]
            if spec.days == "all":
                dias_repr.append("all")
            else:
                dias_repr.append(";".join(map(str, spec.days)))

        meta_csv = {
            "type": "line",
            "title": f"Comparar estaciones {estaciones}",
            "xLabel": "Hora",
            "yLabel": "Valor medio",
            "stations": estaciones,
            "dias": dias_repr,
        }
        write_series_csv(
            join(Constantes.RUTA_SALIDA, titulo_csv),
            x=x,
            ys=series_csv,
            meta=meta_csv,
        )

    # ===========================
    # 5) Gráfica línea comparar matrices
    # ===========================
    if histograma_comparar_matrices and Constantes.MATRIZ_CUSTOM is not None:
        cadenas = histograma_comparar_matrices.split("-")
        deltaMatriz = int(cadenas[0])
        estaciones1 = list(map(int, cadenas[1].split(";")))
        estaciones2 = list(map(int, cadenas[2].split(";")))
        media_flag = cadenas[3] == "M"

        # Call original function if still needed for image generation
        eoc2 = estadisticasOcupacionHorarias(matrizDeseada, Constantes.DELTA_TIME)
        titulo_img = auxiliar_ficheros.formatoArchivo(
            "Grafica_CompararMatrices", "png"
        )
        eoc2.HistogramaCompararMatrices(
            Constantes.MATRIZ_CUSTOM.matrix,
            deltaMatriz,
            estaciones1,
            estaciones2,
            media=media_flag,
            nombreGrafica=titulo_img,
        )

        # Calculate data - comportamiento horario, así que 24 horas
        x = list(range(24))

        # Current matrix mean by hour
        current_vals = matrizDeseada.mean(axis=0).tolist()

        # Custom matrix mean by hour
        custom_vals = Constantes.MATRIZ_CUSTOM.matrix.mean(axis=0).tolist()

        # Generate filename with timestamp and hash
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = "GraficaCompararMatrices"
        content_hash = hashlib.sha1(base_name.encode('utf-8')).hexdigest()[:8]
        json_filename = f"{timestamp}_Grafica_{content_hash}.json"
        json_path = Path(Constantes.RUTA_SALIDA) / json_filename

        # Create comparison chart with matrix comparison semantics
        series_specs = [
            {
                "station_id": -1,  # Virtual station for current matrix
                "days": "all",
                "values": current_vals,
                "aggregation": "mean"
            },
            {
                "station_id": -2,  # Virtual station for custom matrix
                "days": "all",
                "values": custom_vals,
                "aggregation": "mean"
            }
        ]

        # Manually construct chart JSON since this is a special case
        chart_json = {
            "id": f"matrix_comparison_{deltaMatriz}",
            "kind": "comparison",
            "format": "json",
            "visualization": {
                "recommended": "line",
                "supported": ["line", "area", "bar"]
            },
            "data": {
                "x": {
                    "values": x,
                    "label": "Hour of Day",
                    "type": "temporal",
                    "unit": "hour",
                    "domain": [0, 23]
                },
                "series": [
                    {
                        "id": "current",
                        "label": "Current Matrix",
                        "values": current_vals,
                        "metadata": {
                            "derived": False,
                            "aggregation": "mean",
                            "matrix_type": "current"
                        }
                    },
                    {
                        "id": "custom",
                        "label": "Custom Matrix",
                        "values": custom_vals,
                        "metadata": {
                            "derived": False,
                            "aggregation": "mean",
                            "matrix_type": "custom"
                        }
                    }
                ]
            },
            "context": {
                "title": "Compare Matrices",
                "delta": deltaMatriz,
                "media": media_flag,
                "estaciones1": estaciones1,
                "estaciones2": estaciones2
            }
        }

        # Save JSON
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(chart_json, f, ensure_ascii=False, indent=2)

        charts.append(chart_json)

        # CSV backward compatibility
        ys_csv = {
            "current": current_vals,
            "custom": custom_vals,
        }
        meta_csv = {
            "type": "line",
            "title": "Comparar matrices",
            "xLabel": "Hora",
            "yLabel": "Media",
            "delta": deltaMatriz,
            "media": media_flag,
            "estaciones1": estaciones1,
            "estaciones2": estaciones2,
        }
        write_series_csv(
            join(Constantes.RUTA_SALIDA, titulo_img),
            x=x,
            ys=ys_csv,
            meta=meta_csv,
        )

    # ===========================
    # 5) Mapas de densidad (instantáneos)
    # ===========================
    if mapa_densidad:
        # formato: "inst1;inst2[+est1;est2;...]" (si se manda "-L" no se usa aquí)
        if "+" in mapa_densidad:
            cadena, est_str = mapa_densidad.split("+", 1)
            estaciones = list(map(int, est_str.split(";")))
        else:
            cadena = mapa_densidad
            estaciones = []

        instantes = list(map(int, cadena.split(";")))
        mapa = MapaDensidad2(Constantes.COORDENADAS)
        # segundo parámetro por posición: lista de estaciones
        mapa.cargarDatos(matrizDeseada, estaciones)

        for instante in instantes:
            mapa.representarHeatmap(instante=instante)
            base_png = auxiliar_ficheros.formatoArchivo(
                f"Heatmap_instante{instante}", "png"
            )
            df_frame = pd.DataFrame({
                "station_id": np.arange(matrizDeseada.shape[1]),
                "t": instante,
                "value": matrizDeseada.iloc[instante, :].tolist(),
            })
            df_frame.to_csv(
                join(Constantes.RUTA_SALIDA, base_png.replace(".png", ".csv")),
                index=False,
            )

    # ===========================
    # 6) Video de densidad
    # ===========================
    if mapa_densidad_video:
        # formato: "inicio:fin[+est1;est2;...]" donde fin puede ser "end"
        if "+" in mapa_densidad_video:
            momentos, est_str = mapa_densidad_video.split("+", 1)
            estaciones = list(map(int, est_str.split(";")))
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
        mapa.cargarDatos(matrizDeseada, estaciones)
        nombre_video = auxiliar_ficheros.formatoArchivo(
            f"video_densidad_{momentoInicio}_{momentoFinal}_{texto_estaciones}",
            "mp4",
        )
        mapa.realizarVideoHeatmap(
            momentoInicio,
            momentoFinal,
            rutaSalida=join(Constantes.RUTA_SALIDA, nombre_video),
        )

        rows = []
        for t in range(momentoInicio, momentoFinal + 1):
            vals = matrizDeseada.iloc[t, :].tolist()
            for sid, v in enumerate(vals):
                rows.append((t, sid, v))
        df = pd.DataFrame(rows, columns=["t", "station_id", "value"])
        df.to_csv(
            join(Constantes.RUTA_SALIDA, nombre_video.replace(".mp4", ".csv")),
            index=False,
        )

    # ===========================
    # 7) Mapa Voronoi
    # ===========================
    if mapa_voronoi:
        # formato: "inst1;inst2;..."
        mapas = list(map(int, mapa_voronoi.split(";")))
        for instante in mapas:
            man_vor = manejar_Voronoi(matrizDeseada, Constantes.COORDENADAS)
            man_vor.cargarMapaInstante(instante)
            nombrePNG = auxiliar_ficheros.formatoArchivo(
                f"MapaVoronoi_instante{instante}", "png"
            )
            man_vor.realizarFoto(join(Constantes.RUTA_SALIDA, nombrePNG))
            pd.DataFrame({
                "station_id": np.arange(matrizDeseada.shape[1]),
                "t": instante,
                "value": matrizDeseada.iloc[instante, :].tolist(),
            }).to_csv(
                join(Constantes.RUTA_SALIDA, nombrePNG.replace(".png", ".csv")),
                index=False,
            )

    # ===========================
    # 8) Mapa de círculos
    # ===========================
    if mapa_circulo:
        # formato: "inst1;inst2[+est1;est2;...][-L]"
        instantes, estaciones, labels_abiertos = parse_mapa_spec(mapa_circulo)

        for instante in instantes:
            man_circulos = manejar_mapaCirculos(
                matrizDeseada,
                Constantes.COORDENADAS,
                mostrarLabels=labels_abiertos,
                listaEstaciones=estaciones,
            )
            man_circulos.cargarMapaInstante(
                instante,
                listaEstaciones=estaciones,
            )
            nombrePNG = auxiliar_ficheros.formatoArchivo(
                f"MapaCirculo_instante{instante}", "png"
            )
            man_circulos.realizarFoto(join(Constantes.RUTA_SALIDA, nombrePNG))

            if estaciones is None:
                station_ids = np.arange(matrizDeseada.shape[1])
                values = matrizDeseada.iloc[instante, :].tolist()
            else:
                station_ids = estaciones
                values = matrizDeseada.iloc[instante, estaciones].tolist()

            pd.DataFrame({
                "station_id": station_ids,
                "t": instante,
                "value": values,
            }).to_csv(
                join(Constantes.RUTA_SALIDA, nombrePNG.replace(".png", ".csv")),
                index=False,
            )

    maps_json: list[dict] = []

    # ===========================
    # 9) Mapa de desplazamientos (unificado)
    # ===========================
    if mapa_desplazamientos and mapa_desplazamientos != Constantes.CARACTER_NULO_CMD:
        # formato: instante;deltaOrigen;deltaTransformacion;accion;tipo
        try:
            inst_str, delta_orig_str, delta_dest_str, accion_str, tipo_str = (
                mapa_desplazamientos.split(";")
            )
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Cadena mapa_desplazamientos inválida: {mapa_desplazamientos} "
                    "(esperado: instante;deltaOrigen;deltaTransformacion;accion;tipo)"
                ),
            )

        try:
            instante = int(inst_str)
            delta_origen = int(delta_orig_str)
            delta_dest = int(delta_dest_str)
            accion = int(accion_str)  # -1 = coger, 1 = soltar
            tipo = int(tipo_str)  # 1 = real, 0 = ficticio
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Valores no enteros en mapa_desplazamientos: {mapa_desplazamientos}",
            )

        pattern = os.path.join(pathEntrada, "*Desplazamientos_Resultado*.csv")
        candidatos = glob.glob(pattern)
        if not candidatos:
            raise HTTPException(
                status_code=400,
                detail=f"No se encontró ningún fichero que cumpla el patrón {pattern}",
            )
        if len(candidatos) > 1:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Se encontraron varios ficheros Desplazamientos_Resultado*.csv: "
                    f"{candidatos}. Deja solo uno en la carpeta de entrada."
                ),
            )

        try:
            matriz_despl = pd.read_csv(candidatos[0])
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error leyendo el fichero de desplazamientos {candidatos[0]}: {e}",
            )

        df = pd.DataFrame(matriz_despl).copy()

        # 2) Comprobar columnas esperadas del CSV de desplazamientos
        expected_cols = {
            "Estacion origen",
            "Estacion final",
            "tipo de peticion",
            "Utemporal",
            "Cantidad_peticiones",
            "RealFicticio",
        }
        if not expected_cols.issubset(set(df.columns)):
            raise HTTPException(
                status_code=400,
                detail=(
                    "La matriz de desplazamientos no tiene las columnas esperadas "
                    f"(faltan en {list(df.columns)})"
                ),
            )

        # 3) Adaptar delta si es necesario (solo agregación, con Agrupador)
        if delta_origen < delta_dest:
            ratio = delta_dest / delta_origen
            if ratio <= 0 or ratio != int(ratio):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"No se puede colapsar desplazamientos: "
                        f"delta_origen={delta_origen}, delta_dest={delta_dest} "
                        f"(ratio no entero: {ratio})"
                    ),
                )
            df = Agrupador.colapsarDesplazamientos(
                df,
                delta_origen,
                delta_dest,
            )
        elif delta_origen > delta_dest:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"No se puede pasar de delta_origen={delta_origen} "
                    f"a delta_dest={delta_dest} (desagregación no soportada)"
                ),
            )

        # 4) Filtrar filas del instante, acción y tipo
        filtrado = df[
            (df["Utemporal"] == instante)
            & (df["tipo de peticion"] == accion)
            & (df["RealFicticio"] == tipo)
            & (df["Estacion origen"] != df["Estacion final"])
            ]

        if filtrado.empty:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"No hay desplazamientos para instante={instante}, "
                    f"accion={accion}, tipo={tipo}"
                ),
            )

        # 5) Construir matriz S×S con sumas de Cantidad_peticiones
        max_station_id = int(
            max(filtrado["Estacion origen"].max(), filtrado["Estacion final"].max())
        )
        n_stations = max_station_id + 1

        mat_t = np.zeros((n_stations, n_stations), dtype=float)
        for _, row in filtrado.iterrows():
            o = int(row["Estacion origen"])
            d = int(row["Estacion final"])
            cnt = float(row["Cantidad_peticiones"])
            if 0 <= o < n_stations and 0 <= d < n_stations:
                mat_t[o, d] += cnt

        out_totals = mat_t.sum(axis=1).tolist()
        in_totals = mat_t.sum(axis=0).tolist()
        station_ids = list(range(n_stations))

        # 6) Generar HTML interactivo con Folium (MapaDesplazamientos)
        try:
            md = Manejar_Desplazamientos(
                df,
                Constantes.COORDENADAS,
                accion=accion,
                tipo=tipo,
            )
            md.cargarMapaInstante(instante)
            # MapaDesplazamientos guarda en Constantes.RUTA_SALIDA con nombre MapaDesplazamientos_instante{instante}.html
            html_name = auxiliar_ficheros.formatoArchivo(
                f"MapaDesplazamientos_instante{instante}", "html"
            )
            rutaHTML = join(Constantes.RUTA_SALIDA, html_name)
            # Si el save interno ya usa ese nombre/ruta, no hace falta copiar nada ma
        except Exception as e:
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=500,
                detail=f"Error generando mapa interactivo de desplazamientos: {e}",
            )

        # 7) CSV totales por estación
        csv_name = html_name.replace(".html", ".csv")
        rutaCSV = join(Constantes.RUTA_SALIDA, csv_name)
        pd.DataFrame(
            {
                "station_id": station_ids,
                "t": instante,
                "out_total": out_totals,
                "in_total": in_totals,
            }
        ).to_csv(rutaCSV, index=False)

        # 8) JSON resumen
        json_name = html_name.replace(".html", ".json")
        rutaJSON = join(Constantes.RUTA_SALIDA, json_name)
        with open(rutaJSON, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "id": f"MapaDesplazamientos_{instante}",
                    "kind": "displacement_map",
                    "format": "json",
                    "instant": instante,
                    "delta": delta_dest,
                    "accion": accion,
                    "tipo": tipo,
                    "nodes": [
                        {
                            "station_id": int(sid),
                            "out_total": out_totals[i],
                            "in_total": in_totals[i],
                        }
                        for i, sid in enumerate(station_ids)
                    ],
                },
                f,
                ensure_ascii=False,
                indent=2,
            )

        # 9) Descriptor para el frontend
        maps_json.append(
            {
                "id": f"MapaDesplazamientos_{instante}",
                "kind": "map",
                "name": f"Mapa de desplazamientos t={instante}",
                "format": "html",
                "url": f"/{html_name}",
                "api_full_url": None,
            }
        )

    # ===========================
    # 10) Filtrados (CSV)
    # ===========================

    # 10.1 Filtrado_EstValor (día): "operadorValor;veces;indice_dia"
    if filtrado_EstSuperiorValor and filtrado_EstSuperiorValor != "_":
        try:
            partes = filtrado_EstSuperiorValor.split(";")
            if len(partes) != 3:
                raise ValueError(
                    f"Cadena filtrado_EstSuperiorValor inválida: {filtrado_EstSuperiorValor}"
                )

            op_func, valor_str, op_name = __obtenerOperador(partes[0])
            veces = int(partes[1])
            dia_idx = int(partes[2])

            estaciones = filtrador.consultarEstacionesSuperioresAUnValor(
                float(valor_str),
                veces,
                dia_idx,
                operador=op_func,
            )

            nombre = auxiliar_ficheros.formatoArchivo(
                f"Filtrado_Estaciones{op_name}Valor_DIA{dia_idx}_{op_name}{valor_str}_{veces}",
                "csv",
            )
            ruta = join(pathSalida, nombre)
            pandas.DataFrame({"station_id": estaciones}).to_csv(ruta, index=False)
        except Exception as e:
            print(f"[WARN] Error en Filtrado_EstSuperiorValor: {e}")

    # 10.2 Filtrado_EstValorDias (mes): "operadorValor;veces;dias;dias_excepcion"
    if filtrado_EstSuperiorValorDias and filtrado_EstSuperiorValorDias != "_":
        try:
            partes = filtrado_EstSuperiorValorDias.split(";")
            if len(partes) != 4:
                raise ValueError(
                    f"Cadena filtrado_EstSuperiorValorDias inválida: {filtrado_EstSuperiorValorDias}"
                )

            op_func, valor_str, op_name = __obtenerOperador(partes[0])
            veces = int(partes[1])
            cad_dias = partes[2]
            dias_excepcion = int(partes[3])

            if cad_dias == "all":
                dias = list(range(diasMatrizDeseada))
            else:
                dias = list(map(int, cad_dias.split(";")))

            estaciones = filtrador.consultarEstacionesSuperioresAUnValorEnVariosDias(
                float(valor_str),
                veces,
                dias,
                diasPerdon=dias_excepcion,
                operador=op_func,
            )

            nombre = auxiliar_ficheros.formatoArchivo(
                f"Filtrado_Estaciones{op_name}Valor_MES_{op_name}{valor_str}_{veces}_{'-'.join(map(str, dias))}_{dias_excepcion}",
                "csv",
            )
            ruta = join(pathSalida, nombre)
            pandas.DataFrame({"station_id": estaciones}).to_csv(ruta, index=False)
        except Exception as e:
            print(f"[WARN] Error en Filtrado_EstSuperiorValorDias: {e}")

    # 10.3 Filtrado_Horas: "operadorValor;porcentajeEstaciones"
    if filtrado_HorasSuperiorValor and filtrado_HorasSuperiorValor != "_":
        try:
            partes = filtrado_HorasSuperiorValor.split(";")
            if len(partes) != 2:
                raise ValueError(
                    f"Cadena filtrado_HorasSuperiorValor inválida: {filtrado_HorasSuperiorValor}"
                )

            op_func, valor_str, op_name = __obtenerOperador(partes[0])
            porcentajeEst = float(partes[1])

            horas_idx = filtrador.consultarHorasEstacionesSuperioresAUnValor(
                float(valor_str),
                porcentajeEst,
                operador=op_func,
            )

            nombre = auxiliar_ficheros.formatoArchivo(
                f"Filtrado_Horas{op_name}Valor_{op_name}{valor_str}_{porcentajeEst}",
                "csv",
            )
            ruta = join(pathSalida, nombre)
            pandas.DataFrame({"t_index": horas_idx}).to_csv(ruta, index=False)
        except Exception as e:
            print(f"[WARN] Error en Filtrado_HorasSuperiorValor: {e}")

    # 10.4 Filtrado_PorcentajeEstaciones: "operadorValor-est1;est2;..."
    if filtrado_PorcentajeHoraEstacionMasValor and filtrado_PorcentajeHoraEstacionMasValor != "_":
        try:
            partes = filtrado_PorcentajeHoraEstacionMasValor.split("-")
            if len(partes) != 2:
                raise ValueError(
                    f"Cadena filtrado_PorcentajeHoraEstacionMasValor inválida: {filtrado_PorcentajeHoraEstacionMasValor}"
                )

            op_func, valor_str, op_name = __obtenerOperador(partes[0])
            estaciones = list(map(int, partes[1].split(";")))

            porcentaje_tiempo = filtrador.consultarPorcentajeTiempoEstacionSuperiorAUnValor(
                float(valor_str),
                estaciones,
                operador=op_func,
            )

            nombre = auxiliar_ficheros.formatoArchivo(
                f"Filtrado_PorcentajeEstaciones{op_name}Valor_{op_name}{valor_str}_{'-'.join(map(str, estaciones))}",
                "csv",
            )
            ruta = join(pathSalida, nombre)
            pandas.DataFrame({"percent": [porcentaje_tiempo]}).to_csv(ruta, index=False)
        except Exception as e:
            print(f"[WARN] Error en Filtrado_PorcentajeEstaciones: {e}")

    return {"ok": True, "charts": charts, "maps": maps_json}