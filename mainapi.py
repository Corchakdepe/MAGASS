"""
BikeSim FastAPI Backend
Manages bike simulation execution, analysis, and results serving
"""
import csv
import os
import asyncio
import re
from pathlib import Path
from datetime import datetime
from typing import Optional, List
import logging
import json

from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse

from Backend import Constantes
from Frontend.analysis_models import AnalysisArgs, StationDays, SimulateArgs
from Frontend.analysis_runner import run_analysis
from Frontend.simulation_runner import run_simulation

# ============================================
# CONFIGURATION
# ============================================

# DOCKER-COMPATIBLE
ROOT_DIR = Path(__file__).resolve().parent  # This is /app in Docker
RESULTS_BASE_FOLDER = ROOT_DIR / "results"  # /app/results (mounted volume)
UPLOADS_FOLDER = ROOT_DIR / "uploads"  # /app/uploads (mounted volume)
HISTORY_FILE = RESULTS_BASE_FOLDER / "simulations_history.json"



# Map visualization types and formats
MAP_KINDS = [
    ("MapaDensidad", "Densidad", "html"),
    ("MapaCirculos", "Circles", "html"),
    ("MapaDesplazamientos", "Desplazamientos", "html"),
    ("MapaVoronoi", "Voronoi", "html"),
    ("MapaEspera", "Espera", "html"),
    ("MapaDensidad", "Densidad", "png"),
    ("MapaCirculos", "Circles", "png"),
    ("MapaDesplazamientos", "Desplazamientos", "png"),
    ("MapaVoronoi", "Voronoi", "png"),
    ("MapaEspera", "Espera", "png"),
]

# ============================================
# APP INITIALIZATION
# ============================================

app = FastAPI(title="BikeSim API", version="1.0")

# Get allowed origins from environment variable or use defaults
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:8000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configurable via environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Create required directories
UPLOADS_FOLDER.mkdir(exist_ok=True)
RESULTS_BASE_FOLDER.mkdir(exist_ok=True)


# ============================================
# UTILITY FUNCTIONS
# ============================================

def _n() -> str:
    """Returns null character from constants"""
    return getattr(Constantes, "CARACTER_NULO_CMD", "_")


def parse_int_list_from_text(text: str) -> list[int]:
    """Extracts all integers from text string"""
    return [int(x) for x in re.findall(r"\d+", text)]


def create_timestamp() -> str:
    """Generates timestamp string for folder naming"""
    return datetime.now().strftime("%Y%m%d_%H%M%S")


# ============================================
# HISTORY MANAGEMENT
# ============================================

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


# ============================================
# FOLDER MANAGEMENT
# ============================================

def find_run_folder(run: str = None) -> Optional[Path]:
    """Finds simulation folder by name or returns latest"""
    if run:
        folder = RESULTS_BASE_FOLDER / run
        return folder if folder.exists() else None
    else:
        return get_latest_simulation_folder()


def get_latest_simulation_folder() -> Optional[Path]:
    """Returns most recently modified simulation folder"""
    folders = [f for f in RESULTS_BASE_FOLDER.glob("*_sim_*") if f.is_dir()]

    if not folders:
        return None

    latest = max(folders, key=lambda x: x.stat().st_mtime)
    logging.info(f"Latest simulation folder: {latest}")
    return latest


def create_simulation_folder(
        stress_type: int,
        stress: float,
        walk_cost: float,
        delta: int,
        simname: Optional[str] = None,
        cityname: Optional[str] = None,
        number_of_stations: Optional[int] = None,
        number_of_bikes: Optional[int] = None,
        simdata: Optional[dict] = None,
) -> Path:
    """Creates new simulation output folder with metadata"""
    timestamp = create_timestamp()
    folder_name = f"{timestamp}_sim_ST{stress_type}_S{stress:.2f}_WC{walk_cost:.2f}_D{delta}"
    output_folder = RESULTS_BASE_FOLDER / folder_name
    output_folder.mkdir(parents=True, exist_ok=True)

    logging.info(f"Created simulation output folder: {output_folder}")

    # Save metadata to history
    append_simulation_metadata(
        simname=simname or folder_name,
        simfolder=folder_name,
        cityname=cityname,
        number_of_stations=number_of_stations,
        number_of_bikes=number_of_bikes,
        simdata=simdata,
    )

    return output_folder


# ============================================
# FILTER UTILITIES (for analysis)
# ============================================

def _load_stations_from_file(path: Path) -> list[int]:
    """Loads station IDs from filter result file"""
    text = path.read_text(encoding="utf-8")

    # Normalize separators: convert commas and newlines to semicolons
    text = text.replace(",", ";").replace("\r", ";").replace("\n", ";")
    tokens = [t.strip() for t in text.split(";") if t.strip()]

    stations: list[int] = []
    for t in tokens:
        if t.isdigit():
            stations.append(int(t))

    return stations


def _find_last_filter_file(output_folder: str) -> Path:
    """Finds most recent filter result file in output folder"""
    out_dir = Path(output_folder)

    # Possible filter file patterns
    patterns = [
        "*Filtrado_Estaciones*.csv",
        "*Filtrado_Estaciones*.txt",
        "*Filtrado_Horas*.csv",
        "*Filtrado_Horas*.txt",
        "*Filtrado_PorcentajeEstaciones*.csv",
        "*Filtrado_PorcentajeEstaciones*.txt",
    ]

    candidates: list[Path] = []
    for pat in patterns:
        candidates.extend(out_dir.glob(pat))

    if not candidates:
        raise HTTPException(
            status_code=400,
            detail="El filtro no devolvió estaciones para los mapas"
        )

    # Return most recent by modification time
    return sorted(candidates, key=lambda p: p.stat().st_mtime)[-1]


# ============================================
# PYDANTIC MODELS
# ============================================


class AnalysisRequest(AnalysisArgs):
    use_filter_for_maps: bool = False
    use_filter_for_graphs: bool = False
    filter_result_filename: Optional[str] = None
    graf_linea_comp_est: Optional[List[StationDays]] = None


# ============================================
# API ENDPOINTS - INFO
# ============================================

@app.get("/")
async def root():
    """API information and available endpoints"""
    return {
        "name": "BikeSim API",
        "version": "1.0",
        "endpoints": {
            "simulation": "/exe/simular-json",
            "analysis": "/exe/analizar-json",
            "list_simulations": "/list-simulations",
            "simulations_history": "/simulations-history",
            "validate_folder": "/validate-folder",
            "summary": "/simulation-summary",
            "results_list": "/results/list",
            "results_file": "/results/file/{run_folder}/{fname}",
            "filters_result": "/filters/result",
        },
    }


# ============================================
# API ENDPOINTS - SIMULATIONS
# ============================================

@app.get("/list-simulations")
async def list_simulations():
    """Lists all simulation folders with enriched metadata"""
    try:
        folders = [f for f in RESULTS_BASE_FOLDER.glob("*_sim_*") if f.is_dir()]
        folders_sorted = sorted(folders, key=lambda x: x.stat().st_mtime, reverse=True)

        # Enrich history with station/bike info if missing
        history = enrich_history_with_station_info()
        meta_by_folder = {
            s.get("simfolder"): s for s in history.get("simulations", [])
        }

        simulations = []
        for folder in folders_sorted:
            stat = folder.stat()
            created = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
            file_count = len(list(folder.glob("*")))
            meta = meta_by_folder.get(folder.name, {})

            simulations.append({
                "name": meta.get("simname", folder.name),
                "simfolder": folder.name,
                "path": str(folder),
                "created": created,
                "file_count": file_count,
                "cityname": meta.get("cityname"),
                "numberOfStations": meta.get("numberOfStations"),
                "numberOfBikes": meta.get("numberOfBikes"),
                "simdataId": meta.get("simdataId"),
                "simdata": meta.get("simdata", {}),
            })

        return {"simulations": simulations, "total": len(simulations)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing simulations: {e}")


@app.get("/simulations-history")
async def get_simulations_history():
    """Returns simulations history JSON directly (for frontend)"""
    try:
        history = enrich_history_with_station_info()
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading history: {e}")


@app.get("/simulation-by-name")
async def get_simulation_by_name(name: str = Query(...)):
    """Finds simulation by name in history"""
    history = load_history()

    for sim in history.get("simulations", []):
        if sim.get("simname") == name:
            return sim

    raise HTTPException(status_code=404, detail=f"Simulation not found: {name}")


@app.get("/simulation-summary")
async def get_simulation_summary(folder: Optional[str] = Query(default=None)):
    """Returns simulation summary data as comma-separated string"""
    try:
        if folder:
            folder_path = RESULTS_BASE_FOLDER / folder
            if not folder_path.exists() or not folder_path.is_dir():
                logging.error(f"Requested summary for missing folder: {folder_path}")
                raise HTTPException(status_code=400, detail=f"Folder not found: {folder}")
        else:
            folder_path = get_latest_simulation_folder()
            if not folder_path:
                # Return default empty summary
                return "0," + ",".join(["0.0"] * 13)

        # Find summary file
        summary_files = list(folder_path.glob("*ResumenEjecucion*.txt"))

        if not summary_files:
            logging.warning(f"No ResumenEjecucion file found in {folder_path}")
            return "0," + ",".join(["0.0"] * 13)

        summary_path = summary_files[0]
        logging.info(f"Reading summary from: {summary_path}")
        return summary_path.read_text(encoding="utf-8").strip()

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error reading summary: {e}")
        raise HTTPException(status_code=500, detail=f"Error reading summary: {e}")


@app.get("/validate-folder")
async def validate_folder(path: str = Query(...)):
    """Validates if folder exists and counts files"""
    try:
        folder_path = Path(path)

        if not folder_path.is_absolute():
            folder_path = ROOT_DIR / folder_path

        exists = folder_path.exists() and folder_path.is_dir()
        file_count = len(list(folder_path.rglob("*"))) if exists else 0

        return {
            "valid": exists,
            "path": str(folder_path),
            "file_count": file_count
        }

    except Exception as e:
        logging.error(f"Folder validation failed: {e}")
        return {"valid": False, "error": str(e)}


# ============================================
# API ENDPOINTS - RESULTS
# ============================================

@app.get("/results/list")
async def results_list(
        run: Optional[str] = Query(None),
        kind: Optional[str] = Query(None),
        format: Optional[str] = Query(None),
        request: Request = None,
):
    """Lists all result files (maps, graphs) for a simulation run"""
    folder = find_run_folder(run)

    if not folder:
        return {"items": [], "run": None, "api_base": str(request.base_url)}

    api_base = str(request.base_url).rstrip("/")

    map_files = []
    graph_files = []
    filter_files = []

    for file in folder.rglob("*"):
        if not file.is_file():
            continue

        ext = file.suffix.lower()
        name = file.name

        # Detect map files
        if ext == ".html" and any(prefix in name for (prefix, _, _) in MAP_KINDS):
            if kind and kind != "map":
                continue
            if format and format != "html":
                continue
            map_files.append(file)
            continue

        # Detect graph files
        if ext == ".json" and "Grafica" in name:
            if kind and kind != "graph":
                continue
            if format and format != "json":
                continue
            graph_files.append(file)
            continue

        if ext == ".csv" and "Filtrado_" in name:

            if kind and kind != "filter":
                continue
            if format and format != "csv":  # use "csv" here, not ".csv"
                continue
            filter_files.append(file)
            continue

    items = []

    # Process map files
    if not kind or kind == "map":
        for file in sorted(map_files, key=lambda f: f.stat().st_mtime, reverse=True):
            ext = file.suffix.lower()
            name = file.name
            fmt = "html" if ext == ".html" else "png"
            relative_url = f"/results/file/{folder.name}/{name}"

            items.append({
                "id": f"{folder.name}:{name}",
                "name": name,
                "kind": "map",
                "format": fmt,
                "url": relative_url,
                "api_full_url": f"{api_base}{relative_url}",
                "created": datetime.fromtimestamp(file.stat().st_mtime).isoformat(),
            })

    # Process graph files
    if not kind or kind == "graph":
        for file in sorted(graph_files, key=lambda f: f.stat().st_mtime, reverse=True):
            ext = file.suffix.lower()
            name = file.name
            fmt = "csv" if ext == ".csv" else "json"
            relative_url = f"/results/file/{folder.name}/{name}"

            items.append({
                "id": f"{folder.name}:{name}",
                "name": name,
                "kind": "graph",
                "format": fmt,
                "url": relative_url,
                "api_full_url": f"{api_base}{relative_url}",
                "created": datetime.fromtimestamp(file.stat().st_mtime).isoformat(),
            })
    if not kind or kind == "filter":
        for file in sorted(filter_files, key=lambda f: f.stat().st_mtime, reverse=True):
            name = file.name
            relative_url = f"/results/file/{folder.name}/{name}"
            items.append({
                "id": f"{folder.name}:{name}",
                "name": name,
                "kind": "filter",
                "format": "csv",  # Guaranteed by detection logic
                "url": relative_url,
                "api_full_url": f"{api_base}{relative_url}",
                "created": datetime.fromtimestamp(file.stat().st_mtime).isoformat(),
            })

    return {"items": items, "run": folder.name, "api_base": api_base}


@app.get("/results/file/{run_folder}/{fname:path}")
async def results_file(run_folder: str, fname: str):
    """Serves individual result files (maps, graphs, etc.)"""
    allowed_folder = (RESULTS_BASE_FOLDER / run_folder).resolve()
    file_path = (allowed_folder / fname).resolve()

    # Security: prevent path traversal
    if not str(file_path).startswith(str(allowed_folder)):
        raise HTTPException(
            status_code=400,
            detail=f"Path traversal detected: {file_path}"
        )

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {fname}")

    ext = file_path.suffix.lower()

    # Serve HTML maps directly
    if ext == ".html":
        html = file_path.read_text(encoding="utf-8")
        return HTMLResponse(content=html)

    # Serve other file types with appropriate media types
    media_types = {
        ".png": "image/png",
        ".csv": "text/csv",
        ".json": "application/json",
    }

    media_type = media_types.get(ext, "application/octet-stream")
    return FileResponse(str(file_path), media_type=media_type)


@app.get("/download-results")
async def download_results(folder_name: Optional[str] = Query(None)):
    """Downloads simulation summary text file"""
    try:
        if folder_name:
            result_folder = RESULTS_BASE_FOLDER / folder_name
        else:
            result_folder = get_latest_simulation_folder()

        if not result_folder or not result_folder.exists():
            raise HTTPException(status_code=404, detail="Results folder not found")

        summary_file = result_folder / "simulation_summary.txt"

        if not summary_file.exists():
            raise HTTPException(status_code=404, detail="Results file not found")

        return FileResponse(
            path=summary_file,
            filename=f"{result_folder.name}_results.txt",
            media_type="text/plain",
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading results: {e}")


# ============================================
# API ENDPOINTS - EXECUTION
# ============================================

@app.post("/exe/simular-json")
def exe_simular_json(args: SimulateArgs):
    """Executes bike simulation with given parameters"""
    try:
        # Create output folder if not specified
        if not args.ruta_salida:
            output_folder = create_simulation_folder(
                stress_type=args.stress_type,
                stress=args.stress,
                walk_cost=args.walk_cost,
                delta=args.delta,
                simname=args.simname,
            )
            ruta_salida = str(output_folder)
        else:
            ruta_salida = args.ruta_salida
            os.makedirs(ruta_salida, exist_ok=True)

        # Run simulation
        run_simulation(
            ruta_entrada=args.ruta_entrada,
            ruta_salida=ruta_salida,
            stress_type=args.stress_type,
            stress=args.stress,
            walk_cost=args.walk_cost,
            delta=args.delta,
            dias=args.dias,
        )

        return {"ok": True, "output_folder_name": ruta_salida}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/exe/analizar-json")
async def analizar(req: AnalysisRequest):
    """Executes analysis with optional filtering for maps/graphs"""

    try:
        # === FILTER FOR MAPS ===
        if req.use_filter_for_maps:
            if not req.filtro or not req.tipo_filtro:
                raise HTTPException(
                    status_code=400,
                    detail="use_filter_for_maps=true requiere 'filtro' y 'tipo_filtro'"
                )

            # Step 1: run filter only
            solo_filtro_args = AnalysisArgs(
                input_folder=req.input_folder,
                output_folder=req.output_folder,
                seleccion_agregacion=req.seleccion_agregacion,
                delta_media=req.delta_media,
                delta_acumulada=req.delta_acumulada,
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
                filtrado_EstValor=req.filtrado_EstValor,
                filtrado_EstValorDias=req.filtrado_EstValorDias,
                filtrado_Horas=req.filtrado_Horas,
                filtrado_PorcentajeEstaciones=req.filtrado_PorcentajeEstaciones,
                filtro=req.filtro,
                tipo_filtro=req.tipo_filtro,
                apply_filter_to_line_comp=False,
            )

            _ = run_analysis(solo_filtro_args)

            # Step 2: locate filter result (for maps you already use loader+append logic)
            if req.filter_result_filename:
                filter_path = Path(req.output_folder) / req.filter_result_filename
            else:
                filter_path = _find_last_filter_file(req.output_folder)

            estaciones = _load_stations_from_file(filter_path) if filter_path else []
            estaciones_str = ";".join(str(i) for i in estaciones) if estaciones else ""

            def add_estaciones(spec: Optional[str]) -> Optional[str]:
                if not spec or "+" in spec or not estaciones_str:
                    return spec
                return f"{spec}+{estaciones_str}"

            # Step 3: run analysis with filtered maps
            final_args = AnalysisArgs(
                input_folder=req.input_folder,
                output_folder=req.output_folder,
                seleccion_agregacion=req.seleccion_agregacion,
                delta_media=req.delta_media,
                delta_acumulada=req.delta_acumulada,
                graf_barras_est_med=req.graf_barras_est_med,
                graf_barras_est_acum=req.graf_barras_est_acum,
                graf_barras_dia=req.graf_barras_dia,
                graf_linea_comp_est=req.graf_linea_comp_est,
                graf_linea_comp_mats=req.graf_linea_comp_mats,
                mapa_densidad=add_estaciones(req.mapa_densidad),
                video_densidad=add_estaciones(req.video_densidad),
                mapa_voronoi=req.mapa_voronoi,
                mapa_circulo=add_estaciones(req.mapa_circulo),
                mapa_desplazamientos=req.mapa_desplazamientos,
                filtrado_EstValor=req.filtrado_EstValor,
                filtrado_EstValorDias=req.filtrado_EstValorDias,
                filtrado_Horas=req.filtrado_Horas,
                filtrado_PorcentajeEstaciones=req.filtrado_PorcentajeEstaciones,
                filtro=req.filtro,
                tipo_filtro=req.tipo_filtro,
                apply_filter_to_line_comp=False,
                filter_result_filename=filter_path.name if filter_path else None,
            )

            return run_analysis(final_args)

        # === FILTER FOR GRAPHS (líneas + barras) ===
        if req.use_filter_for_graphs:
            if not req.filtro or not req.tipo_filtro:
                raise HTTPException(
                    status_code=400,
                    detail="use_filter_for_graphs=true requiere 'filtro' y 'tipo_filtro'"
                )

            # 1) correr solo filtro (genera Filtrado_*.csv)
            solo_filtro_args = AnalysisArgs(
                input_folder=req.input_folder,
                output_folder=req.output_folder,
                seleccion_agregacion=req.seleccion_agregacion,
                delta_media=req.delta_media,
                delta_acumulada=req.delta_acumulada,
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
                filtrado_EstValor=req.filtrado_EstValor,
                filtrado_EstValorDias=req.filtrado_EstValorDias,
                filtrado_Horas=req.filtrado_Horas,
                filtrado_PorcentajeEstaciones=req.filtrado_PorcentajeEstaciones,
                filtro=req.filtro,
                tipo_filtro=req.tipo_filtro,
                use_filter_for_maps=False,
                use_filter_for_graphs=False,
                filter_result_filename=None,
            )

            _ = run_analysis(solo_filtro_args)

            # 2) localizar resultado del filtro
            if req.filter_result_filename:
                filter_path = Path(req.output_folder) / req.filter_result_filename
            else:
                filter_path = _find_last_filter_file(req.output_folder)

            estaciones = _load_stations_from_file(filter_path) if filter_path else []
            estaciones = estaciones or []  # lista de ints

            if not estaciones:
                raise HTTPException(
                    status_code=400,
                    detail="El filtro no ha seleccionado ninguna estación"
                )

            # 3) construir graf_linea_comp_est solo con estaciones filtradas
            station_days_list: List[StationDays] = [
                StationDays(station_id=st, days="all") for st in estaciones
            ]

            # 4) construir specs de barras a partir de estaciones filtradas
            # si solo quieres una estación en barras, usa la primera
            barra_est = estaciones[0]
            dias_spec = "all"

            graf_barras_est_med_spec: Optional[str] = None
            graf_barras_est_acum_spec: Optional[str] = None

            if req.graf_barras_est_med:
                graf_barras_est_med_spec = f"{barra_est}-{dias_spec}"

            if req.graf_barras_est_acum:
                graf_barras_est_acum_spec = f"{barra_est}-{dias_spec}"

            # 5) lanzar análisis con gráficas filtradas
            final_args = AnalysisArgs(
                input_folder=req.input_folder,
                output_folder=req.output_folder,
                seleccion_agregacion=req.seleccion_agregacion,
                delta_media=req.delta_media,
                delta_acumulada=req.delta_acumulada,
                graf_barras_est_med=graf_barras_est_med_spec,
                graf_barras_est_acum=graf_barras_est_acum_spec,
                graf_barras_dia=req.graf_barras_dia,
                graf_linea_comp_est=station_days_list,
                graf_linea_comp_mats=req.graf_linea_comp_mats,
                mapa_densidad=None,
                video_densidad=None,
                mapa_voronoi=None,
                mapa_circulo=None,
                mapa_desplazamientos=None,
                filtrado_EstValor=req.filtrado_EstValor,
                filtrado_EstValorDias=req.filtrado_EstValorDias,
                filtrado_Horas=req.filtrado_Horas,
                filtrado_PorcentajeEstaciones=req.filtrado_PorcentajeEstaciones,
                filtro=req.filtro,
                tipo_filtro=req.tipo_filtro,
                use_filter_for_maps=False,
                use_filter_for_graphs=False,
                filter_result_filename=filter_path.name if filter_path else None,
            )

            return run_analysis(final_args)

        # === STANDARD ANALYSIS (no filtering) ===
        final_args = AnalysisArgs(
            input_folder=req.input_folder,
            output_folder=req.output_folder,
            seleccion_agregacion=req.seleccion_agregacion,
            delta_media=req.delta_media,
            delta_acumulada=req.delta_acumulada,
            graf_barras_est_med=req.graf_barras_est_med,
            graf_barras_est_acum=req.graf_barras_est_acum,
            graf_barras_dia=req.graf_barras_dia,
            graf_linea_comp_est=req.graf_linea_comp_est,
            graf_linea_comp_mats=req.graf_linea_comp_mats,
            mapa_densidad=req.mapa_densidad,
            video_densidad=req.video_densidad,
            mapa_voronoi=req.mapa_voronoi,
            mapa_circulo=req.mapa_circulo,
            mapa_desplazamientos=req.mapa_desplazamientos,
            filtrado_EstValor=req.filtrado_EstValor,
            filtrado_EstValorDias=req.filtrado_EstValorDias,
            filtrado_Horas=req.filtrado_Horas,
            filtrado_PorcentajeEstaciones=req.filtrado_PorcentajeEstaciones,
            filtro=req.filtro,
            tipo_filtro=req.tipo_filtro,
            use_filter_for_maps=False,
            use_filter_for_graphs=False,
            filter_result_filename=None,
        )

        return run_analysis(final_args)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# API ENDPOINTS - FILTERS
# ============================================

@app.get("/filters/result")
async def get_filter_result(
        run: str = Query(..., description="Simulation folder name (simfolder)"),
        filename: str = Query(..., description="Filter file name"),
        kind: str = Query("stations", description="'stations' | 'hours' | 'percent'"),
):
    """Returns parsed filter results from a specific file"""
    folder = find_run_folder(run)

    if not folder:
        raise HTTPException(status_code=404, detail=f"Run not found: {run}")

    file_path = (folder / filename).resolve()

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Filter file not found: {filename}")

    text = file_path.read_text(encoding="utf-8").strip()

    # Parse based on kind
    if kind in ("stations", "hours"):
        numbers = parse_int_list_from_text(text)
        return {"stations": numbers} if kind == "stations" else {"hours": numbers}

    if kind == "percent":
        match = re.search(r"\d+(\.\d+)?", text)
        value = float(match.group(0)) if match else 0.0
        return {"percent": value}

    return {"raw": text}


# ============================================
# API ENDPOINTS - DASHBOARD
# ============================================

@app.get("/dashboard/initial-data")
async def get_dashboard_initial_data(run: str = Query(..., description="Simulation folder name")):
    """Returns initial data (city, bikes, stations) for a specific simulation run"""
    try:
        # Get simulation metadata from history
        history = load_history()

        # Find the simulation by folder name
        sim = None
        for s in history.get("simulations", []):
            if s.get("simfolder") == run:
                sim = s
                break

        if not sim:
            # Try to enrich history and search again
            history = enrich_history_with_station_info()
            for s in history.get("simulations", []):
                if s.get("simfolder") == run:
                    sim = s
                    break

        if not sim:
            raise HTTPException(
                status_code=404,
                detail=f"Simulation not found: {run}"
            )

        # Return the data in the format expected by frontend
        return {
            "city": sim.get("cityname", "N/A"),
            "numBikes": sim.get("numberOfBikes", 0),
            "numStations": sim.get("numberOfStations", 0),
            "simname": sim.get("simname", run),
        }

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching initial data: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching initial data: {e}"
        )


@app.get("/dashboard/stations-map")
async def get_dashboard_stations_map(run: str = Query(..., description="Simulation folder name")):
    """
    Generates and returns a stations circle map for dashboard (async version)
    Creates a circle map at instant 0 with all stations if it doesn't exist
    """
    try:
        # Get simulation folder
        folder = find_run_folder(run)

        if not folder:
            raise HTTPException(status_code=404, detail=f"Simulation folder not found: {run}")

        # Look for existing dashboard circle map
        dashboard_map_name = "Dashboard_MapaCirculos_Instant0.html"
        dashboard_map_path = folder / dashboard_map_name

        # If dashboard map exists, return it immediately
        if dashboard_map_path.exists():
            logging.info(f"Serving existing dashboard map: {dashboard_map_path}")
            html_content = dashboard_map_path.read_text(encoding="utf-8")
            return HTMLResponse(content=html_content)

        # Generate new circle map at instant 0 with all stations
        logging.info(f"Generating dashboard circle map for: {run}")

        try:
            # Create analysis args for circle map generation
            analysis_args = AnalysisArgs(
                input_folder=str(folder),
                output_folder=str(folder),
                seleccion_agregacion="1",
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
                mapa_circulo="0",
                mapa_desplazamientos=None,
                filtrado_EstValor=None,
                filtrado_EstValorDias=None,
                filtrado_Horas=None,
                filtrado_PorcentajeEstaciones=None,
                filtro=None,
                tipo_filtro=None,
            )

            # Run analysis in thread pool to avoid blocking
            logging.info("Running analysis to generate circle map (async)...")
            result = await asyncio.to_thread(run_analysis, analysis_args)
            logging.info(f"Analysis completed: {result}")

            # Find the generated circle map
            circle_maps = sorted(
                folder.glob("*MapaCirculos*.html"),
                key=lambda x: x.stat().st_mtime,
                reverse=True
            )

            if circle_maps:
                generated_map = circle_maps[0]
                html_content = generated_map.read_text(encoding="utf-8")

                # Save dashboard copy for future quick access
                try:
                    dashboard_map_path.write_text(html_content, encoding="utf-8")
                    logging.info(f"Created dashboard map copy: {dashboard_map_path}")
                except Exception as copy_error:
                    logging.warning(f"Could not create dashboard map copy: {copy_error}")

                return HTMLResponse(content=html_content)
            else:
                raise Exception("Map generation completed but no HTML file found")

        except Exception as gen_error:
            logging.error(f"Error generating circle map: {gen_error}")

            # Return fallback HTML
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Mapa de Estaciones - Error</title>
                <meta charset="utf-8">
                <style>
                    body {{
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    }}
                    .message {{
                        text-align: center;
                        padding: 3rem;
                        background: white;
                        border-radius: 12px;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        max-width: 500px;
                    }}
                    h2 {{
                        color: #333;
                        margin-bottom: 1rem;
                    }}
                    p {{
                        color: #666;
                        line-height: 1.6;
                    }}
                    .icon {{ font-size: 3rem; margin-bottom: 1rem; }}
                </style>
            </head>
            <body>
                <div class="message">
                    <div class="icon">⚠️</div>
                    <h2>Error al Generar Mapa</h2>
                    <p>No se pudo generar el mapa de estaciones automáticamente.</p>
                    <p><small>{str(gen_error)}</small></p>
                </div>
            </body>
            </html>
            """

            return HTMLResponse(content=html_content)

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in dashboard stations map endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching stations map: {e}")
