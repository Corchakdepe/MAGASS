from __future__ import annotations
import requests
import time
import os
from os.path import join
from typing import Optional, List
import json
import requests
import time
import numpy as np
import pandas as pd
from datetime import datetime
from pathlib import Path

from Backend import Constantes
from Backend.Auxiliares import auxiliar_ficheros, Extractor
from Backend.GuardarCargarDatos import GuardarCargarMatrices
from Backend.OperacionesDeltas.SimuladorDeltasEstadistico import SimuladorDeltasEstadistico
from bike_simulator5 import bike_simulator5


def calculate_total_bikes_from_deltas(deltas_file_path: str) -> int:
    """
    Compute total number of bikes from the first data row of the deltas matrix
    (initial state as 'leave-bike' movements'), as in the TFG.
    """
    df = pd.read_csv(deltas_file_path, header=0)

    if len(df) == 0:
        print(f"Warning: {deltas_file_path} has no data rows")
        return 0

    initial_bikes_row = df.iloc[0, :]
    total_bikes = int(initial_bikes_row.sum())

    print(f"Calculated total bikes from deltas ({deltas_file_path}): {total_bikes}")
    return total_bikes


def get_city_from_coordenadas(coordenadas_file: str) -> str:
    """
    Attempt to determine city name from coordinates using geocoding.
    """
    try:
        df = pd.read_csv(coordenadas_file)
        if len(df) > 0:
            # Use first station's coordinates as representative
            lat = float(df.iloc[0, 1])
            lon = float(df.iloc[0, 2])

            # Try to geocode
            city_info = _try_geocode_xyz(lat, lon)
            if city_info and city_info.get("city") and city_info["city"] != "Unknown City":
                return city_info["city"]
    except Exception as e:
        print(f"Error getting city from coordinates: {e}")

    # If geocoding fails, try to extract from folder name or input path
    return ""


def get_station_count_from_capacidades(ruta_entrada: str) -> int:
    """
    Get number of stations from capacidades.csv in input folder.
    """
    try:
        archivoCapacidad = auxiliar_ficheros.buscar_archivosEntrada(
            ruta_entrada, ["capacidades"]
        )[0]
        df = pd.read_csv(archivoCapacidad, header=None)
        return len(df)
    except Exception as e:
        print(f"Error getting station count: {e}")
        return 0  # NO DEFAULT - return 0 if can't determine


def get_capacity_stats_from_capacidades(capacidades_file: str) -> dict:
    """
    Get capacity statistics from capacidades.csv file.
    """
    try:
        df = pd.read_csv(capacidades_file, header=None)

        if df.empty:
            return {"total": 0, "avg": 0, "min": 0, "max": 0}

        # Handle possible header row
        if df.iloc[0, 0] == 'header':
            capacity_values = df.iloc[1:, 0].astype(float).values
        else:
            capacity_values = df.iloc[:, 0].astype(float).values

        return {
            "total": float(capacity_values.sum()),
            "avg": float(capacity_values.mean()),
            "min": float(capacity_values.min()),
            "max": float(capacity_values.max()),
            "count": len(capacity_values)
        }
    except Exception as e:
        print(f"Error getting capacity stats: {e}")
        return {"total": 0, "avg": 0, "min": 0, "max": 0, "count": 0}


def get_coordinates_stats(coordenadas_file: str) -> dict:
    """
    Get coordinate statistics from coordenadas.csv file.
    """
    try:
        df = pd.read_csv(coordenadas_file)
        if len(df) > 0:
            latitudes = df.iloc[:, 1].astype(float).values
            longitudes = df.iloc[:, 2].astype(float).values

            return {
                "avg_lat": float(np.mean(latitudes)),
                "avg_lon": float(np.mean(longitudes)),
                "count": len(df)
            }
    except Exception as e:
        print(f"Error getting coordinate stats: {e}")

    return {"avg_lat": 0, "avg_lon": 0, "count": 0}


def _try_geocode_xyz(latitude: float, longitude: float) -> dict:
    """
    Try to geocode coordinates using geocode.xyz API.
    URL format: https://geocode.xyz/{lat},{lon}?json=1&auth=YOUR_API_KEY
    """
    try:


        # CORRECT URL FORMAT with auth parameter
        url = f"https://geocode.xyz/{latitude},{longitude}?json=1&auth=500671923186888675793x32130"


        time.sleep(1)

        response = requests.get(url, timeout=10)

        if response.status_code == 200:
            data = response.json()

            # Check for rate limiting or error messages
            if isinstance(data, dict):
                if data.get('error'):
                    error_msg = data.get('error', {}).get('description', str(data.get('error')))
                    if 'Throttled' in error_msg or 'rate' in error_msg.lower():
                        print(f"Geocode.xyz rate limited: {error_msg}")
                    return {}

                # Check if we got a valid response
                if 'standard' in data or 'city' in data:
                    city = data.get('city') or data.get('standard', {}).get('city', '')
                    country = data.get('country') or data.get('standard', {}).get('countryname', '')

                    # Clean up city name
                    if city:
                        city = city.replace('"', '').strip()
                        if "Throttled!" in city:
                            city = ""

                    # Only return if we actually got a city
                    if city:
                        return {
                            "city": city,
                            "country": country or "",
                            "full_location": f"{city}, {country}" if city and country else city
                        }

    except requests.exceptions.Timeout:
        print(f"Geocode.xyz timeout for {latitude},{longitude}")
    except requests.exceptions.RequestException as e:
        print(f"Geocode.xyz request failed: {e}")
    except Exception as e:
        print(f"Unexpected error in geocoding: {e}")

    return {}

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
        ruta_entrada: str = None,
):
    """
    Update simulations_history.json with new simulation entry.
    All data is derived from actual files, no hardcoded defaults.
    """
    try:
        history_path = Path("./results/simulations_history.json")

        # Load existing history or create new
        if history_path.exists():
            with open(history_path, "r", encoding="utf-8") as f:
                history = json.load(f)
        else:
            history = {"simulations": []}

        # Create new simulation entry with REAL data only
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
                "avg_lon": coordinates_stats.get("avg_lon", 0)
            },
             "simdata": {  # ← SIMULATION PARAMETERS HERE
                "stress_type": stress_type,
                "stress": stress,
                "walk_cost": walk_cost,
                "delta": delta,
                "dias": dias if dias else []
            },
            "path": str(Path("./results") / sim_folder),
            "created": datetime.now().isoformat(),
        }

        # Check if simulation already exists
        found = False
        for i, sim in enumerate(history.get("simulations", [])):
            if sim.get("simfolder") == sim_folder:
                history["simulations"][i] = new_sim
                found = True
                print(f"Updated existing simulation in history: {sim_folder}")
                break

        if not found:
            history["simulations"].append(new_sim)
            print(f"Added new simulation to history: {sim_folder}")

        # Save history
        history_path.parent.mkdir(parents=True, exist_ok=True)
        with open(history_path, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2, ensure_ascii=False)

        print(f"Simulation history updated successfully at {history_path}")

    except Exception as e:
        print(f"Error updating simulation history: {e}")


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
    """
    High-level simulation used by API.
    Captures ALL metadata from actual files - NO HARDCODED DEFAULTS.
    """
    Constantes.DELTA_TIME = delta
    Constantes.COSTE_ANDAR = walk_cost
    Constantes.PORCENTAJE_ESTRES = stress
    Constantes.RUTA_SALIDA = ruta_salida

    # ============ CAPTURE ALL SIMULATION METADATA FROM FILES ============
    # 1. Get total bikes from *_15min_deltas.csv
    deltas_files = auxiliar_ficheros.buscar_archivosEntrada(
        ruta_entrada, ["15min_deltas"]
    )
    total_bikes = 0
    if deltas_files:
        total_bikes = calculate_total_bikes_from_deltas(deltas_files[0])

    # 2. Get station count and capacity stats
    num_stations = 0
    capacity_stats = {"total": 0, "avg": 0, "min": 0, "max": 0, "count": 0}

    try:
        archivoCapacidad = auxiliar_ficheros.buscar_archivosEntrada(
            ruta_entrada, ["capacidades"]
        )[0]
        capacity_stats = get_capacity_stats_from_capacidades(archivoCapacidad)
        num_stations = capacity_stats["count"]

        # Copy capacities to results
        pd.read_csv(archivoCapacidad).to_csv(
            join(ruta_salida, "capacidades.csv"), index=False
        )
    except Exception as e:
        print(f"Error processing capacities: {e}")

    # 3. Get city from coordinates if available
    city = ""
    coordinates_stats = {"avg_lat": 0, "avg_lon": 0, "count": 0}

    try:
        # First check if coordenadas.csv exists in input
        coordenadas_files = auxiliar_ficheros.buscar_archivosEntrada(
            ruta_entrada, ["coordenadas"]
        )
        if coordenadas_files:
            coordinates_stats = get_coordinates_stats(coordenadas_files[0])
            city = get_city_from_coordenadas(coordenadas_files[0])
    except Exception as e:
        print(f"Error processing coordinates: {e}")

    # 4. Extract sim name from folder or use provided
    sim_folder = Path(ruta_salida).name
    if not simname:
        simname = sim_folder

    # 5. Update simulation history with ALL REAL DATA - NO DEFAULTS
    update_simulation_history(
        sim_folder=sim_folder,
        sim_name=simname,
        city=city,
        num_stations=num_stations,
        total_bikes=total_bikes,
        capacity_stats=capacity_stats,
        coordinates_stats=coordinates_stats,
        ruta_entrada=ruta_entrada,
        stress_type=stress_type,
        stress=stress,
        walk_cost=walk_cost,
        delta=delta,
        dias=dias,
    )
    # ====================================================

    # Rest of simulation execution...
    ficheros, ficheros_distancia = GuardarCargarMatrices.cargarDatosParaSimular(
        ruta_entrada
    )

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

    # Save coordinates to results
    if coordenadas is not None:
        pd.DataFrame(coordenadas).to_csv(
            join(Constantes.RUTA_SALIDA, "coordenadas.csv"), index=False
        )

    # Copy indices_bicicleta.csv if exists
    indices_file = auxiliar_ficheros.buscar_archivosEntrada(
        ruta_entrada, ["indices_bicicleta"]
    )
    if indices_file:
        import shutil
        shutil.copy2(indices_file[0], join(ruta_salida, "indices_bicicleta.csv"))
        print(f"Copied indices_bicicleta.csv to {ruta_salida}")