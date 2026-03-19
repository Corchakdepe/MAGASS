from __future__ import annotations

import json
import logging
import shutil
import time
from datetime import datetime
from os.path import join
from pathlib import Path
from typing import Optional, List

import numpy as np
import pandas as pd
import requests

from bikesim import Constantes
from bikesim.auxiliares import Extractor, auxiliar_ficheros
from bikesim.utils import GuardarCargarMatrices
from bike_simulator5 import bike_simulator5


def _safe_numeric_station_columns(df: pd.DataFrame) -> list:
    station_cols = []
    for col in df.columns:
        if isinstance(col, int):
            station_cols.append(col)
        elif isinstance(col, str) and col.strip().isdigit():
            station_cols.append(col)
    return station_cols


def calculate_total_bikes_from_deltas(deltas_file_path: str) -> int:
    """
    The first data row of the deltas CSV is the initial bikes per station.
    """
    df = pd.read_csv(deltas_file_path, header=0)

    if df.empty:
        logging.warning("Empty deltas file: %s", deltas_file_path)
        return 0

    station_cols = _safe_numeric_station_columns(df)

    if not station_cols:
        raise ValueError(f"No station columns found in {deltas_file_path}")

    first_row = pd.to_numeric(df.loc[0, station_cols], errors="coerce").fillna(0)
    total_bikes = int(first_row.sum())

    logging.warning("TOTAL_BIKES source file: %s", deltas_file_path)
    logging.warning("Detected station columns: %s", len(station_cols))
    logging.warning("First row total bikes: %s", total_bikes)
    logging.warning("First row sample: %s", first_row.iloc[:10].tolist())

    return max(total_bikes, 0)


def get_capacity_stats_from_capacidades(capacidades_file: str) -> dict:
    try:
        df = pd.read_csv(capacidades_file, header=None)

        if df.empty:
            return {"total": 0, "avg": 0, "min": 0, "max": 0, "count": 0}

        first_value = str(df.iloc[0, 0]).strip().lower()
        if first_value == "header":
            values = pd.to_numeric(df.iloc[1:, 0], errors="coerce").dropna().values
        else:
            values = pd.to_numeric(df.iloc[:, 0], errors="coerce").dropna().values

        if len(values) == 0:
            return {"total": 0, "avg": 0, "min": 0, "max": 0, "count": 0}

        return {
            "total": float(values.sum()),
            "avg": float(values.mean()),
            "min": float(values.min()),
            "max": float(values.max()),
            "count": int(len(values)),
        }
    except Exception as e:
        logging.exception("Error reading capacities %s: %s", capacidades_file, e)
        return {"total": 0, "avg": 0, "min": 0, "max": 0, "count": 0}


def get_coordinates_stats(coordenadas_file: str) -> dict:
    try:
        df = pd.read_csv(coordenadas_file)
        if len(df) > 0:
            latitudes = pd.to_numeric(df.iloc[:, 1], errors="coerce").dropna().values
            longitudes = pd.to_numeric(df.iloc[:, 2], errors="coerce").dropna().values
            return {
                "avg_lat": float(np.mean(latitudes)) if len(latitudes) else 0.0,
                "avg_lon": float(np.mean(longitudes)) if len(longitudes) else 0.0,
                "count": int(len(df)),
            }
    except Exception as e:
        logging.exception("Error reading coordinates %s: %s", coordenadas_file, e)

    return {"avg_lat": 0, "avg_lon": 0, "count": 0}


def _try_geocode_xyz(latitude: float, longitude: float) -> dict:
    try:
        url = f"https://geocode.xyz/{latitude},{longitude}?json=1&auth=500671923186888675793x32130"
        time.sleep(1)
        response = requests.get(url, timeout=10)

        if response.status_code == 200:
            data = response.json()

            if isinstance(data, dict):
                if data.get("error"):
                    return {}

                city = data.get("city") or data.get("standard", {}).get("city", "")
                country = data.get("country") or data.get("standard", {}).get("countryname", "")

                city = city.replace('"', "").strip() if city else ""
                if city:
                    return {
                        "city": city,
                        "country": country or "",
                        "full_location": f"{city}, {country}" if country else city,
                    }
    except Exception:
        pass

    return {}


def get_city_from_coordenadas(coordenadas_file: str) -> dict:
    try:
        df = pd.read_csv(coordenadas_file)
        if len(df) > 0:
            lat = float(df.iloc[0, 1])
            lon = float(df.iloc[0, 2])
            return _try_geocode_xyz(lat, lon)
    except Exception as e:
        logging.warning("Error geocoding coordinates from %s: %s", coordenadas_file, e)

    return {}


def save_simulation_info(
    ruta_salida: str,
    city: str,
    country: str,
    full_location: str,
    capacity_stats: dict,
    coordinates_stats: dict,
    total_bikes: int,
) -> None:
    total_capacity = float(capacity_stats.get("total", 0))
    utilization = (total_bikes / total_capacity * 100) if total_capacity > 0 else 0.0

    simulation_info = {
        "CITY": city or "Unknown City",
        "FULL_LOCATION": full_location or city or "",
        "COUNTRY": country or "",
        "STATIONS": {
            "count": int(capacity_stats.get("count", 0)),
            "avg_capacity": round(float(capacity_stats.get("avg", 0)), 2),
        },
        "TOTAL_CAPACITY": total_capacity,
        "MIN_CAPACITY": float(capacity_stats.get("min", 0)),
        "MAX_CAPACITY": float(capacity_stats.get("max", 0)),
        "CAPACITY_RANGE": f"{int(capacity_stats.get('min', 0))}-{int(capacity_stats.get('max', 0))}",
        "TOTAL_BIKES": int(total_bikes),
        "ACTIVE_BIKES": int(total_bikes),
        "UTILIZATION": {
            "percentage": round(utilization, 2),
            "description": f"{utilization:.2f}% utilization",
        },
        "COORDINATES": {
            "average_latitude": float(coordinates_stats.get("avg_lat", 0)),
            "average_longitude": float(coordinates_stats.get("avg_lon", 0)),
        },
        "SIMULATION_ID": Path(ruta_salida).name,
        "GENERATED_AT": datetime.now().isoformat(),
    }

    output_path = Path(ruta_salida) / "simulation_info.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(simulation_info, f, indent=2, ensure_ascii=False)

    logging.warning("Saved simulation_info.json: %s", output_path)
    logging.warning("Saved TOTAL_BIKES=%s ACTIVE_BIKES=%s", total_bikes, total_bikes)


def update_simulation_history(
    sim_folder: str,
    sim_name: str,
    city: str,
    num_stations: int,
    total_bikes: int,
    capacity_stats: dict,
    coordinates_stats: dict,
    stress_type: int,
    stress: float,
    walk_cost: float,
    delta: int,
    dias: Optional[List[int]] = None,
):
    history_path = Path("./results/simulations_history.json")

    if history_path.exists():
        with open(history_path, "r", encoding="utf-8") as f:
            history = json.load(f)
    else:
        history = {"simulations": []}

    new_sim = {
        "simname": sim_name,
        "simfolder": sim_folder,
        "simdataId": sim_folder,
        "cityname": city,
        "numberOfStations": num_stations,
        "numberOfBikes": total_bikes,
        "total_capacity": capacity_stats.get("total", 0),
        "avg_capacity": capacity_stats.get("avg", 0),
        "min_capacity": capacity_stats.get("min", 0),
        "max_capacity": capacity_stats.get("max", 0),
        "coordinates": {
            "avg_lat": coordinates_stats.get("avg_lat", 0),
            "avg_lon": coordinates_stats.get("avg_lon", 0),
        },
        "simdata": {
            "stress_type": stress_type,
            "stress": stress,
            "walk_cost": walk_cost,
            "delta": delta,
            "dias": dias if dias else [],
        },
        "path": str(Path("./results") / sim_folder),
        "created": datetime.now().isoformat(),
    }

    sims = history.get("simulations", [])
    replaced = False

    for i, sim in enumerate(sims):
        if sim.get("simfolder") == sim_folder:
            sims[i] = new_sim
            replaced = True
            break

    if not replaced:
        sims.append(new_sim)

    history["simulations"] = sims
    history_path.parent.mkdir(parents=True, exist_ok=True)

    with open(history_path, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2, ensure_ascii=False)


def run_simulation(
    ruta_entrada: str,
    ruta_salida: str,
    stress_type: int,
    stress: float,
    walk_cost: float,
    delta: int,
    dias: Optional[List[int]] = None,
    simname: Optional[str] = None,
) -> None:
    Constantes.DELTA_TIME = delta
    Constantes.COSTE_ANDAR = walk_cost
    Constantes.PORCENTAJE_ESTRES = stress
    Constantes.RUTA_SALIDA = ruta_salida

    sim_folder = Path(ruta_salida).name
    if not simname:
        simname = sim_folder

    Path(ruta_salida).mkdir(parents=True, exist_ok=True)

    deltas_files = auxiliar_ficheros.buscar_archivosEntrada(ruta_entrada, ["15min_deltas"])
    logging.warning("Matched deltas files: %s", deltas_files)

    total_bikes = 0
    if deltas_files:
        total_bikes = calculate_total_bikes_from_deltas(deltas_files[0])

    archivo_capacidad = auxiliar_ficheros.buscar_archivosEntrada(ruta_entrada, ["capacidades"])[0]
    capacity_stats = get_capacity_stats_from_capacidades(archivo_capacidad)
    num_stations = int(capacity_stats["count"])

    shutil.copy2(archivo_capacidad, join(ruta_salida, "capacidades.csv"))
    logging.warning("Copied capacidades.csv to %s", join(ruta_salida, "capacidades.csv"))

    coordinates_stats = {"avg_lat": 0, "avg_lon": 0, "count": 0}
    city = ""
    country = ""
    full_location = ""

    coordenadas_files = auxiliar_ficheros.buscar_archivosEntrada(ruta_entrada, ["coordenadas"])
    if coordenadas_files:
        coordinates_stats = get_coordinates_stats(coordenadas_files[0])
        geo = get_city_from_coordenadas(coordenadas_files[0])
        city = geo.get("city", "")
        country = geo.get("country", "")
        full_location = geo.get("full_location", city)

    logging.warning(
        "Sanity check => stations=%s total_capacity=%s total_bikes=%s",
        num_stations,
        capacity_stats["total"],
        total_bikes,
    )

    if capacity_stats["total"] > 0 and total_bikes > capacity_stats["total"]:
        logging.error(
            "INVALID TOTAL_BIKES: %s > TOTAL_CAPACITY: %s. Wrong file or wrong parsing.",
            total_bikes,
            capacity_stats["total"],
        )

    ficheros, ficheros_distancia = GuardarCargarMatrices.cargarDatosParaSimular(ruta_entrada)

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
    (
        nearest_stations_idx,
        nearest_stations_distance,
        initial_movements,
        real_movements,
        capacidadInicial,
        coordenadas,
    ) = bs.load_data(
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
    auxiliar_ficheros.guardarMatricesEnFicheros(
        matricesSalida, resumen, Constantes.RUTA_SALIDA
    )

    if coordenadas is not None:
        pd.DataFrame(coordenadas).to_csv(
            join(Constantes.RUTA_SALIDA, "coordenadas.csv"), index=False
        )
        logging.warning("Saved coordenadas.csv to %s", join(Constantes.RUTA_SALIDA, "coordenadas.csv"))

    indices_file = auxiliar_ficheros.buscar_archivosEntrada(ruta_entrada, ["indices_bicicleta"])
    if indices_file:
        shutil.copy2(indices_file[0], join(ruta_salida, "indices_bicicleta.csv"))
        logging.warning("Copied indices_bicicleta.csv to %s", join(ruta_salida, "indices_bicicleta.csv"))

    update_simulation_history(
        sim_folder=sim_folder,
        sim_name=simname,
        city=city,
        num_stations=num_stations,
        total_bikes=total_bikes,
        capacity_stats=capacity_stats,
        coordinates_stats=coordinates_stats,
        stress_type=stress_type,
        stress=stress,
        walk_cost=walk_cost,
        delta=delta,
        dias=dias,
    )

    save_simulation_info(
        ruta_salida=ruta_salida,
        city=city,
        country=country,
        full_location=full_location,
        capacity_stats=capacity_stats,
        coordinates_stats=coordinates_stats,
        total_bikes=total_bikes,
    )
