import csv
import json
import logging
import os
from pathlib import Path
from typing import Optional, List

ROOT_DIR = Path(__file__).resolve().parent  # This is /app in Docker
RESULTS_BASE_FOLDER = ROOT_DIR / "results"  # /app/results (mounted volume)
UPLOADS_FOLDER = ROOT_DIR / "uploads"  # /app/uploads (mounted volume)
HISTORY_FILE = RESULTS_BASE_FOLDER / "simulations_history.json"



def load_history() -> dict:
    """Loads simulation history from JSON file"""
    if not HISTORY_FILE.exists():
        return {"simulations": []}

    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        logging.error("Failed to parse history file")
        return {"simulations": []}


def save_history(history: dict) -> None:
    """Saves simulation history to JSON file"""
    HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2, ensure_ascii=False)


def append_simulation_metadata(
        simname: str,
        simfolder: str,
        cityname: Optional[str],
        number_of_stations: Optional[int],
        number_of_bikes: Optional[int],
        simdata: Optional[dict] = None,
        simdata_id: Optional[str] = None,
) -> None:
    """Appends or updates simulation metadata in history"""
    history = load_history()
    simulations: List[dict] = history.get("simulations", [])

    # Remove existing entry for this simfolder (update scenario)
    simulations = [s for s in simulations if s.get("simfolder") != simfolder]

    # Add new entry
    simulations.append({
        "simname": simname,
        "simfolder": simfolder,
        "cityname": cityname,
        "numberOfStations": number_of_stations,
        "numberOfBikes": number_of_bikes,
        "simdata": simdata or {},
        "simdataId": simdata_id or simfolder,
    })

    history["simulations"] = simulations
    save_history(history)


def get_latest_station_bikes_info() -> tuple[Optional[str], Optional[int], Optional[int]]:
    """Extracts city, station count, and bike count from latest CSV in uploads folder"""
    folder = UPLOADS_FOLDER
    # Tengo que repensar eso para que no este hardcoded pero aun no se bien como va a ser el upload por ahora se queda aqui
    suffix = "_15min_deltas.csv"

    try:
        files = [f for f in os.listdir(folder) if f.endswith(suffix)]
    except FileNotFoundError:
        return None, None, None

    if not files:
        return None, None, None

    # Get most recent file
    latest_file = sorted(files)[-1]
    base = os.path.splitext(os.path.basename(latest_file))[0]
    city = base.split("_", 1)[0]

    csv_path = os.path.join(folder, latest_file)

    try:
        with open(csv_path, newline="", encoding="utf-8") as csvfile:
            reader = csv.reader(csvfile)
            rows = list(reader)

            if len(rows) < 2:
                return city, None, None

            # First row: station IDs, second row: bike counts
            station_numbers = [int(x) for x in rows[0] if x.strip().isdigit()]
            bike_counts = [int(x) for x in rows[1] if x.strip().isdigit()]

            number_of_stations = len(station_numbers)
            number_of_bikes = sum(bike_counts) if bike_counts else None

            return city, number_of_stations, number_of_bikes
    except Exception as e:
        logging.error(f"Error reading CSV: {e}")
        return city, None, None


def enrich_history_with_station_info() -> dict:
    """Updates history with station/bike info from latest upload if missing"""
    history = load_history()
    sims = history.get("simulations", [])

    city, n_stations, n_bikes = get_latest_station_bikes_info()

    if city is None:
        return history

    changed = False

    for sim in sims:
        if sim.get("cityname") is None:
            sim["cityname"] = city
            changed = True

        if sim.get("numberOfStations") is None and n_stations is not None:
            sim["numberOfStations"] = n_stations
            changed = True

        if sim.get("numberOfBikes") is None and n_bikes is not None:
            sim["numberOfBikes"] = n_bikes
            changed = True

    if changed:
        history["simulations"] = sims
        save_history(history)

    return history

