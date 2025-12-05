import csv
import os
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
from Frontend.EjecutadorCMD import (
    run_simulation,
    run_analysis,
    run_simulador_estadistico,
    run_restar_directorios,
    AnalysisArgs,
    SimulateArgs,
)

ROOT_DIR = Path(__file__).resolve().parent
RESULTS_BASE_FOLDER = ROOT_DIR / "results"
UPLOADS_FOLDER = ROOT_DIR / "uploads"
HISTORY_FILE = RESULTS_BASE_FOLDER / "simulations_history.json"


def parse_int_list_from_text(text: str) -> list[int]:
    return [int(x) for x in re.findall(r"\d+", text)]


def load_history() -> dict:
    if not HISTORY_FILE.exists():
        return {"simulations": []}
    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_history(history: dict) -> None:
    HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)


def append_simulation_metadata(
    simname: str,
    simfolder: str,
    cityname: Optional[str],
    number_of_stations: Optional[int],
    number_of_bikes: Optional[int],
    simdata: Optional[dict] = None,
    simdata_id: Optional[str] = None,
) -> None:
    history = load_history()
    simulations: List[dict] = history.get("simulations", [])

    simulations = [s for s in simulations if s.get("simfolder") != simfolder]

    simulations.append(
        {
            "simname": simname,
            "simfolder": simfolder,
            "cityname": cityname,
            "numberOfStations": number_of_stations,
            "numberOfBikes": number_of_bikes,
            "simdata": simdata or {},
            "simdataId": simdata_id or simfolder,
        }
    )

    history["simulations"] = simulations
    save_history(history)


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


def _N() -> str:
    return getattr(Constantes, "CARACTER_NULO_CMD", "_")


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOADS_FOLDER.mkdir(exist_ok=True)
RESULTS_BASE_FOLDER.mkdir(exist_ok=True)


def find_run_folder(run: str = None) -> Optional[Path]:
    if run:
        folder = RESULTS_BASE_FOLDER / run
        return folder if folder.exists() else None
    else:
        return get_latest_simulation_folder()


def resolve_folder_path(folder_path: str) -> Path:
    path = Path(folder_path)
    if not path.is_absolute():
        path = ROOT_DIR / path
    if not path.exists():
        raise HTTPException(status_code=400, detail=f"Folder not found: {folder_path}")
    if not path.is_dir():
        raise HTTPException(status_code=400, detail=f"Path is not a directory: {folder_path}")
    return path


def get_results_subfolder(folder_name: str) -> Path:
    path = RESULTS_BASE_FOLDER / folder_name
    if not path.exists() or not path.is_dir():
        raise HTTPException(status_code=400, detail=f"Folder not found: {folder_name}")
    return path


def get_latest_simulation_folder() -> Optional[Path]:
    folders = [f for f in RESULTS_BASE_FOLDER.glob("*_sim_*") if f.is_dir()]
    if not folders:
        return None
    latest = max(folders, key=lambda x: x.stat().st_mtime)
    logging.info(f"Latest simulation folder: {latest}")
    return latest


def create_timestamp() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")


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
    timestamp = create_timestamp()
    folder_name = f"{timestamp}_sim_ST{stress_type}_S{stress:.2f}_WC{walk_cost:.2f}_D{delta}"
    output_folder = RESULTS_BASE_FOLDER / folder_name
    output_folder.mkdir(parents=True, exist_ok=True)
    logging.info(f"Created simulation output folder: {output_folder}")

    append_simulation_metadata(
        simname=simname or folder_name,
        simfolder=folder_name,
        cityname=cityname,
        number_of_stations=number_of_stations,
        number_of_bikes=number_of_bikes,
        simdata=simdata,
    )

    return output_folder


@app.get("/validate-folder")
async def validate_folder(path: str = Query(...)):
    try:
        folder_path = Path(path)
        if not folder_path.is_absolute():
            folder_path = ROOT_DIR / folder_path
        exists = folder_path.exists() and folder_path.is_dir()
        file_count = len(list(folder_path.rglob("*"))) if exists else 0
        return {"valid": exists, "path": str(folder_path), "file_count": file_count}
    except Exception as e:
        logging.error(f"Folder validation failed: {e}")
        return {"valid": False, "error": str(e)}


@app.get("/list-simulations")
async def list_simulations():
    try:
        folders = [f for f in RESULTS_BASE_FOLDER.glob("*_sim_*") if f.is_dir()]
        folders_sorted = sorted(folders, key=lambda x: x.stat().st_mtime, reverse=True)

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

            simulations.append(
                {
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
                }
            )

        return {"simulations": simulations, "total": len(simulations)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing simulations: {e}")


@app.get("/download-results")
async def download_results(folder_name: Optional[str] = Query(None)):
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


@app.get("/simulation-by-name")
async def get_simulation_by_name(name: str = Query(...)):
    history = load_history()
    for sim in history.get("simulations", []):
        if sim.get("simname") == name:
            return sim
    raise HTTPException(status_code=404, detail=f"Simulation not found: {name}")


@app.get("/simulation-summary")
async def get_simulation_summary(folder: Optional[str] = Query(default=None)):
    try:
        if folder:
            folder_path = RESULTS_BASE_FOLDER / folder
            if not folder_path.exists() or not folder_path.is_dir():
                logging.error(f"Requested summary for missing folder: {folder_path}")
                raise HTTPException(status_code=400, detail=f"Folder not found: {folder}")
        else:
            folder_path = get_latest_simulation_folder()

        if not folder_path:
            return "0," + ",".join(["0.0"] * 13)

        summary_files = list(folder_path.glob("*ResumenEjecucion*.txt"))
        if not summary_files:
            logging.warning(f"No ResumenEjecucion file found in {folder_path}")
            return "0," + ",".join(["0.0"] * 13)

        summary_path = summary_files[0]
        logging.info(f"Reading summary from: {summary_path}")
        return summary_path.read_text().strip()
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error reading summary: {e}")
        raise HTTPException(status_code=500, detail=f"Error reading summary: {e}")


@app.get("/")
async def root():
    return {
        "name": "BikeSim API",
        "version": "1.0",
        "endpoints": {
            "simulation": "/exe/simular",
            "analysis": "/exe/analizar",
            "list_simulations": "/list-simulations",
            "validate_folder": "/validate-folder",
            "summary": "/simulation-summary",
            "results_list": "/results/list",
            "results_file": "/results/file/{run_folder}/{fname}",
        },
    }


@app.get("/results/list")
async def results_list(
    run: Optional[str] = Query(None),
    kind: Optional[str] = Query(None),
    request: Request = None,
):
    folder = find_run_folder(run)
    if not folder:
        return {"items": [], "run": None, "api_base": str(request.base_url)}

    api_base = str(request.base_url).rstrip("/")

    map_files = []
    graph_files = []

    for file in folder.rglob("*"):
        if not file.is_file():
            continue

        ext = file.suffix.lower()
        name = file.name

        if ext in [".html", ".png"] and any(prefix in name for (prefix, _, _) in MAP_KINDS):
            if kind and kind != "map":
                continue
            map_files.append(file)
            continue

        if ext in [".csv", ".json"] and ("Grafica" in name or "Filtrado_" in name):
            if kind and kind != "graph":
                continue
            graph_files.append(file)

    items = []

    if not kind or kind == "map":
        for file in sorted(map_files, key=lambda f: f.stat().st_mtime, reverse=True):
            ext = file.suffix.lower()
            name = file.name
            fmt = "html" if ext == ".html" else "png"
            relative_url = f"/results/file/{folder.name}/{name}"
            items.append(
                {
                    "id": f"{folder.name}:{name}",
                    "name": name,
                    "kind": "map",
                    "format": fmt,
                    "url": relative_url,
                    "api_full_url": f"{api_base}{relative_url}",
                    "created": datetime.fromtimestamp(file.stat().st_mtime).isoformat(),
                }
            )

    if not kind or kind == "graph":
        for file in sorted(graph_files, key=lambda f: f.stat().st_mtime, reverse=True):
            ext = file.suffix.lower()
            name = file.name
            fmt = "csv" if ext == ".csv" else "json"
            relative_url = f"/results/file/{folder.name}/{name}"
            items.append(
                {
                    "id": f"{folder.name}:{name}",
                    "name": name,
                    "kind": "graph",
                    "format": fmt,
                    "url": relative_url,
                    "api_full_url": f"{api_base}{relative_url}",
                    "created": datetime.fromtimestamp(file.stat().st_mtime).isoformat(),
                }
            )

    return {"items": items, "run": folder.name, "api_base": api_base}


@app.get("/results/file/{run_folder}/{fname:path}")
async def results_file(run_folder: str, fname: str, request: Request):
    allowed_folder = (RESULTS_BASE_FOLDER / run_folder).resolve()
    file_path = (allowed_folder / fname).resolve()

    if not str(file_path).startswith(str(allowed_folder)):
        raise HTTPException(status_code=400, detail=f"Path traversal detected: resolved {file_path}")
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found at {file_path}")

    ext = file_path.suffix.lower()
    if ext == ".html":
        html = file_path.read_text(encoding="utf-8")
        return HTMLResponse(content=html)
    if ext == ".png":
        return FileResponse(str(file_path), media_type="image/png")
    if ext == ".csv":
        return FileResponse(str(file_path), media_type="text/csv")
    if ext == ".json":
        return FileResponse(str(file_path), media_type="application/json")
    return FileResponse(str(file_path), media_type="application/octet-stream")


def get_latest_station_bikes_info() -> tuple[Optional[str], Optional[int], Optional[int]]:
    folder = "uploads"
    suffix = "_15min_deltas.csv"
    try:
        files = [f for f in os.listdir(folder) if f.endswith(suffix)]
    except FileNotFoundError:
        return None, None, None

    if not files:
        return None, None, None

    latest_file = sorted(files)[-1]
    base = os.path.splitext(os.path.basename(latest_file))[0]
    city = base.split("_", 1)[0]
    csv_path = os.path.join(folder, latest_file)

    with open(csv_path, newline="") as csvfile:
        reader = csv.reader(csvfile)
        rows = list(reader)
        if len(rows) < 2:
            return city, None, None
        station_numbers = [int(x) for x in rows[0] if x.strip().isdigit()]
        bike_counts = [int(x) for x in rows[1] if x.strip().isdigit()]
        number_of_stations = len(station_numbers)
        number_of_bikes = sum(bike_counts) if bike_counts else None

    return city, number_of_stations, number_of_bikes


def enrich_history_with_station_info() -> dict:
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


# =========================
#  NUEVO: análisis con filtro para mapas
# =========================

class AnalysisRequest(AnalysisArgs):
    use_filter_for_maps: bool = False
    filter_result_filename: Optional[str] = None


def _load_stations_from_file(path: Path) -> list[int]:
    text = path.read_text(encoding="utf-8")

    # Normaliza separadores: convertimos comas y saltos de línea a ';'
    text = text.replace(",", ";").replace("\r", ";").replace("\n", ";")

    tokens = [t.strip() for t in text.split(";") if t.strip()]

    stations: list[int] = []
    for t in tokens:
        if t.isdigit():
            stations.append(int(t))

    return stations



def _find_last_filter_file(output_folder: str) -> Path:
    out_dir = Path(output_folder)

    # patrones posibles de los bloques 10.1–10.4
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
            detail="El filtro no devolvió estaciones para los mapas error"
        )

    # último por fecha de modificación
    return sorted(candidates, key=lambda p: p.stat().st_mtime)[-1]



@app.post("/exe/analizar-json")
async def analizar(req: AnalysisRequest):
    try:

        if req.use_filter_for_maps:
            if not req.filtro or not req.tipo_filtro:
                raise HTTPException(
                    status_code=400,
                    detail="use_filter_for_maps=true requiere campos 'filtro' y 'tipo_filtro'",
                )

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
                filter_result_filename=None,
            )

            _ = run_analysis(solo_filtro_args)

            if req.filter_result_filename:
                filter_path = Path(req.output_folder) / req.filter_result_filename
            else:
                filter_path = _find_last_filter_file(req.output_folder)

            estaciones = _load_stations_from_file(filter_path)

            if estaciones:
                estaciones_str = ";".join(str(i) for i in estaciones)
            else:
                estaciones_str = ""

            def add_estaciones(spec: Optional[str]) -> Optional[str]:
                if not spec:
                    return spec
                if "+" in spec:
                    return spec
                if not estaciones_str:
                    # No hay estaciones filtradas: dejamos la spec tal cual
                    return spec
                return f"{spec}+{estaciones_str}"

            mapa_densidad = add_estaciones(req.mapa_densidad)
            video_densidad = add_estaciones(req.video_densidad)
            mapa_circulo = add_estaciones(req.mapa_circulo)

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
                mapa_densidad=mapa_densidad,
                video_densidad=video_densidad,
                mapa_voronoi=req.mapa_voronoi,
                mapa_circulo=mapa_circulo,
                mapa_desplazamientos=req.mapa_desplazamientos,
                filtrado_EstValor=req.filtrado_EstValor,
                filtrado_EstValorDias=req.filtrado_EstValorDias,
                filtrado_Horas=req.filtrado_Horas,
                filtrado_PorcentajeEstaciones=req.filtrado_PorcentajeEstaciones,
                filtro=req.filtro,
                tipo_filtro=req.tipo_filtro,
                use_filter_for_maps=False,
                filter_result_filename=None,
            )

            return run_analysis(final_args)


        if req.use_filter_for_graphs:
            if not req.filtro or not req.tipo_filtro:
                raise HTTPException(
                    status_code=400,
                    detail="use_filter_for_graphs=true requiere campos 'filtro' y 'tipo_filtro'",
                )

            # 1) Ejecutar solo el filtro para generar fichero(s) Filtrado_*
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
                filter_result_filename=None,
            )
            _ = run_analysis(solo_filtro_args)

            # 2) Si quieres usar el resultado del filtro para barras, puedes tocar aquí
            graf_barras_est_med = req.graf_barras_est_med
            graf_barras_est_acum = req.graf_barras_est_acum


            graf_linea_comp_est = req.graf_linea_comp_est

            final_args = AnalysisArgs(
                input_folder=req.input_folder,
                output_folder=req.output_folder,
                seleccion_agregacion=req.seleccion_agregacion,
                delta_media=req.delta_media,
                delta_acumulada=req.delta_acumulada,
                graf_barras_est_med=graf_barras_est_med,
                graf_barras_est_acum=graf_barras_est_acum,
                graf_barras_dia=req.graf_barras_dia,
                graf_linea_comp_est=graf_linea_comp_est,
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
                filter_result_filename=None,
            )
            return run_analysis(final_args)

        final_args = AnalysisArgs(
            input_folder=req.input_folder,
            output_folder=req.output_folder,
            seleccion_agregacion=req.seleccion_agregacion,
            delta_media=req.delta_media,
            delta_acumulada=req.delta_acumulada,
            graf_barras_est_med=req.graf_barras_est_med,
            graf_barras_est_acum=req.graf_barras_est_acum,
            graf_barras_dia=req.graf_barras_dia,
            graf_linea_comp_est=req.graf_linea_comp_est,  # List[StationDays] | None
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
            filter_result_filename=None,
        )
        return run_analysis(final_args)


    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/exe/simular-json")
def exe_simular_json(args: SimulateArgs):
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


@app.get("/filters/result")
async def get_filter_result(
    run: str = Query(..., description="Nombre de la carpeta de simulación (simfolder)"),
    filename: str = Query(..., description="Nombre del fichero de filtrado dentro de la carpeta"),
    kind: str = Query("stations", description="'stations' | 'hours' | 'percent'"),
):
    folder = find_run_folder(run)
    if not folder:
        raise HTTPException(status_code=404, detail=f"Run not found: {run}")

    file_path = (folder / filename).resolve()
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Filter file not found: {filename}")

    text = file_path.read_text(encoding="utf-8").strip()

    if kind in ("stations", "hours"):
        numbers = parse_int_list_from_text(text)
        if kind == "stations":
            return {"stations": numbers}
        else:
            return {"hours": numbers}

    if kind == "percent":
        match = re.search(r"\d+(\.\d+)?", text)
        value = float(match.group(0)) if match else 0.0
        return {"percent": value}

    return {"raw": text}
import csv
import os
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
from Frontend.EjecutadorCMD import (
    run_simulation,
    run_analysis,
    run_simulador_estadistico,
    run_restar_directorios,
    AnalysisArgs,
    SimulateArgs,
)

ROOT_DIR = Path(__file__).resolve().parent
RESULTS_BASE_FOLDER = ROOT_DIR / "results"
UPLOADS_FOLDER = ROOT_DIR / "uploads"
HISTORY_FILE = RESULTS_BASE_FOLDER / "simulations_history.json"


def parse_int_list_from_text(text: str) -> list[int]:
    return [int(x) for x in re.findall(r"\d+", text)]


def load_history() -> dict:
    if not HISTORY_FILE.exists():
        return {"simulations": []}
    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_history(history: dict) -> None:
    HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)


def append_simulation_metadata(
    simname: str,
    simfolder: str,
    cityname: Optional[str],
    number_of_stations: Optional[int],
    number_of_bikes: Optional[int],
    simdata: Optional[dict] = None,
    simdata_id: Optional[str] = None,
) -> None:
    history = load_history()
    simulations: List[dict] = history.get("simulations", [])

    simulations = [s for s in simulations if s.get("simfolder") != simfolder]

    simulations.append(
        {
            "simname": simname,
            "simfolder": simfolder,
            "cityname": cityname,
            "numberOfStations": number_of_stations,
            "numberOfBikes": number_of_bikes,
            "simdata": simdata or {},
            "simdataId": simdata_id or simfolder,
        }
    )

    history["simulations"] = simulations
    save_history(history)


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


def _N() -> str:
    return getattr(Constantes, "CARACTER_NULO_CMD", "_")


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOADS_FOLDER.mkdir(exist_ok=True)
RESULTS_BASE_FOLDER.mkdir(exist_ok=True)


def find_run_folder(run: str = None) -> Optional[Path]:
    if run:
        folder = RESULTS_BASE_FOLDER / run
        return folder if folder.exists() else None
    else:
        return get_latest_simulation_folder()


def resolve_folder_path(folder_path: str) -> Path:
    path = Path(folder_path)
    if not path.is_absolute():
        path = ROOT_DIR / path
    if not path.exists():
        raise HTTPException(status_code=400, detail=f"Folder not found: {folder_path}")
    if not path.is_dir():
        raise HTTPException(status_code=400, detail=f"Path is not a directory: {folder_path}")
    return path


def get_results_subfolder(folder_name: str) -> Path:
    path = RESULTS_BASE_FOLDER / folder_name
    if not path.exists() or not path.is_dir():
        raise HTTPException(status_code=400, detail=f"Folder not found: {folder_name}")
    return path


def get_latest_simulation_folder() -> Optional[Path]:
    folders = [f for f in RESULTS_BASE_FOLDER.glob("*_sim_*") if f.is_dir()]
    if not folders:
        return None
    latest = max(folders, key=lambda x: x.stat().st_mtime)
    logging.info(f"Latest simulation folder: {latest}")
    return latest


def create_timestamp() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")


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
    timestamp = create_timestamp()
    folder_name = f"{timestamp}_sim_ST{stress_type}_S{stress:.2f}_WC{walk_cost:.2f}_D{delta}"
    output_folder = RESULTS_BASE_FOLDER / folder_name
    output_folder.mkdir(parents=True, exist_ok=True)
    logging.info(f"Created simulation output folder: {output_folder}")

    append_simulation_metadata(
        simname=simname or folder_name,
        simfolder=folder_name,
        cityname=cityname,
        number_of_stations=number_of_stations,
        number_of_bikes=number_of_bikes,
        simdata=simdata,
    )

    return output_folder


@app.get("/validate-folder")
async def validate_folder(path: str = Query(...)):
    try:
        folder_path = Path(path)
        if not folder_path.is_absolute():
            folder_path = ROOT_DIR / folder_path
        exists = folder_path.exists() and folder_path.is_dir()
        file_count = len(list(folder_path.rglob("*"))) if exists else 0
        return {"valid": exists, "path": str(folder_path), "file_count": file_count}
    except Exception as e:
        logging.error(f"Folder validation failed: {e}")
        return {"valid": False, "error": str(e)}


@app.get("/list-simulations")
async def list_simulations():
    try:
        folders = [f for f in RESULTS_BASE_FOLDER.glob("*_sim_*") if f.is_dir()]
        folders_sorted = sorted(folders, key=lambda x: x.stat().st_mtime, reverse=True)

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

            simulations.append(
                {
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
                }
            )

        return {"simulations": simulations, "total": len(simulations)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing simulations: {e}")


@app.get("/download-results")
async def download_results(folder_name: Optional[str] = Query(None)):
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


@app.get("/simulation-by-name")
async def get_simulation_by_name(name: str = Query(...)):
    history = load_history()
    for sim in history.get("simulations", []):
        if sim.get("simname") == name:
            return sim
    raise HTTPException(status_code=404, detail=f"Simulation not found: {name}")


@app.get("/simulation-summary")
async def get_simulation_summary(folder: Optional[str] = Query(default=None)):
    try:
        if folder:
            folder_path = RESULTS_BASE_FOLDER / folder
            if not folder_path.exists() or not folder_path.is_dir():
                logging.error(f"Requested summary for missing folder: {folder_path}")
                raise HTTPException(status_code=400, detail=f"Folder not found: {folder}")
        else:
            folder_path = get_latest_simulation_folder()

        if not folder_path:
            return "0," + ",".join(["0.0"] * 13)

        summary_files = list(folder_path.glob("*ResumenEjecucion*.txt"))
        if not summary_files:
            logging.warning(f"No ResumenEjecucion file found in {folder_path}")
            return "0," + ",".join(["0.0"] * 13)

        summary_path = summary_files[0]
        logging.info(f"Reading summary from: {summary_path}")
        return summary_path.read_text().strip()
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error reading summary: {e}")
        raise HTTPException(status_code=500, detail=f"Error reading summary: {e}")


@app.get("/")
async def root():
    return {
        "name": "BikeSim API",
        "version": "1.0",
        "endpoints": {
            "simulation": "/exe/simular",
            "analysis": "/exe/analizar",
            "list_simulations": "/list-simulations",
            "validate_folder": "/validate-folder",
            "summary": "/simulation-summary",
            "results_list": "/results/list",
            "results_file": "/results/file/{run_folder}/{fname}",
        },
    }


@app.get("/results/list")
async def results_list(
    run: Optional[str] = Query(None),
    kind: Optional[str] = Query(None),
    request: Request = None,
):
    folder = find_run_folder(run)
    if not folder:
        return {"items": [], "run": None, "api_base": str(request.base_url)}

    api_base = str(request.base_url).rstrip("/")

    map_files = []
    graph_files = []

    for file in folder.rglob("*"):
        if not file.is_file():
            continue

        ext = file.suffix.lower()
        name = file.name

        if ext in [".html", ".png"] and any(prefix in name for (prefix, _, _) in MAP_KINDS):
            if kind and kind != "map":
                continue
            map_files.append(file)
            continue

        if ext in [".csv", ".json"] and ("Grafica" in name or "Filtrado_" in name):
            if kind and kind != "graph":
                continue
            graph_files.append(file)

    items = []

    if not kind or kind == "map":
        for file in sorted(map_files, key=lambda f: f.stat().st_mtime, reverse=True):
            ext = file.suffix.lower()
            name = file.name
            fmt = "html" if ext == ".html" else "png"
            relative_url = f"/results/file/{folder.name}/{name}"
            items.append(
                {
                    "id": f"{folder.name}:{name}",
                    "name": name,
                    "kind": "map",
                    "format": fmt,
                    "url": relative_url,
                    "api_full_url": f"{api_base}{relative_url}",
                    "created": datetime.fromtimestamp(file.stat().st_mtime).isoformat(),
                }
            )

    if not kind or kind == "graph":
        for file in sorted(graph_files, key=lambda f: f.stat().st_mtime, reverse=True):
            ext = file.suffix.lower()
            name = file.name
            fmt = "csv" if ext == ".csv" else "json"
            relative_url = f"/results/file/{folder.name}/{name}"
            items.append(
                {
                    "id": f"{folder.name}:{name}",
                    "name": name,
                    "kind": "graph",
                    "format": fmt,
                    "url": relative_url,
                    "api_full_url": f"{api_base}{relative_url}",
                    "created": datetime.fromtimestamp(file.stat().st_mtime).isoformat(),
                }
            )

    return {"items": items, "run": folder.name, "api_base": api_base}


@app.get("/results/file/{run_folder}/{fname:path}")
async def results_file(run_folder: str, fname: str, request: Request):
    allowed_folder = (RESULTS_BASE_FOLDER / run_folder).resolve()
    file_path = (allowed_folder / fname).resolve()

    if not str(file_path).startswith(str(allowed_folder)):
        raise HTTPException(status_code=400, detail=f"Path traversal detected: resolved {file_path}")
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found at {file_path}")

    ext = file_path.suffix.lower()
    if ext == ".html":
        html = file_path.read_text(encoding="utf-8")
        return HTMLResponse(content=html)
    if ext == ".png":
        return FileResponse(str(file_path), media_type="image/png")
    if ext == ".csv":
        return FileResponse(str(file_path), media_type="text/csv")
    if ext == ".json":
        return FileResponse(str(file_path), media_type="application/json")
    return FileResponse(str(file_path), media_type="application/octet-stream")


def get_latest_station_bikes_info() -> tuple[Optional[str], Optional[int], Optional[int]]:
    folder = "uploads"
    suffix = "_15min_deltas.csv"
    try:
        files = [f for f in os.listdir(folder) if f.endswith(suffix)]
    except FileNotFoundError:
        return None, None, None

    if not files:
        return None, None, None

    latest_file = sorted(files)[-1]
    base = os.path.splitext(os.path.basename(latest_file))[0]
    city = base.split("_", 1)[0]
    csv_path = os.path.join(folder, latest_file)

    with open(csv_path, newline="") as csvfile:
        reader = csv.reader(csvfile)
        rows = list(reader)
        if len(rows) < 2:
            return city, None, None
        station_numbers = [int(x) for x in rows[0] if x.strip().isdigit()]
        bike_counts = [int(x) for x in rows[1] if x.strip().isdigit()]
        number_of_stations = len(station_numbers)
        number_of_bikes = sum(bike_counts) if bike_counts else None

    return city, number_of_stations, number_of_bikes


def enrich_history_with_station_info() -> dict:
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


# =========================
#  NUEVO: análisis con filtro para mapas
# =========================

class AnalysisRequest(AnalysisArgs):
    use_filter_for_maps: bool = False
    filter_result_filename: Optional[str] = None


def _load_stations_from_file(path: Path) -> list[int]:
    text = path.read_text(encoding="utf-8")

    # Normaliza separadores: convertimos comas y saltos de línea a ';'
    text = text.replace(",", ";").replace("\r", ";").replace("\n", ";")

    tokens = [t.strip() for t in text.split(";") if t.strip()]

    stations: list[int] = []
    for t in tokens:
        if t.isdigit():
            stations.append(int(t))

    return stations



def _find_last_filter_file(output_folder: str) -> Path:
    out_dir = Path(output_folder)

    # patrones posibles de los bloques 10.1–10.4
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
            detail="El filtro no devolvió estaciones para los mapas error"
        )

    # último por fecha de modificación
    return sorted(candidates, key=lambda p: p.stat().st_mtime)[-1]



@app.post("/exe/analizar-json")
async def analizar(req: AnalysisRequest):
    try:

        if req.use_filter_for_maps:
            if not req.filtro or not req.tipo_filtro:
                raise HTTPException(
                    status_code=400,
                    detail="use_filter_for_maps=true requiere campos 'filtro' y 'tipo_filtro'",
                )

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
                filter_result_filename=None,
            )

            _ = run_analysis(solo_filtro_args)

            if req.filter_result_filename:
                filter_path = Path(req.output_folder) / req.filter_result_filename
            else:
                filter_path = _find_last_filter_file(req.output_folder)

            estaciones = _load_stations_from_file(filter_path)

            if estaciones:
                estaciones_str = ";".join(str(i) for i in estaciones)
            else:
                estaciones_str = ""

            def add_estaciones(spec: Optional[str]) -> Optional[str]:
                if not spec:
                    return spec
                if "+" in spec:
                    return spec
                if not estaciones_str:
                    # No hay estaciones filtradas: dejamos la spec tal cual
                    return spec
                return f"{spec}+{estaciones_str}"

            mapa_densidad = add_estaciones(req.mapa_densidad)
            video_densidad = add_estaciones(req.video_densidad)
            mapa_circulo = add_estaciones(req.mapa_circulo)

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
                mapa_densidad=mapa_densidad,
                video_densidad=video_densidad,
                mapa_voronoi=req.mapa_voronoi,
                mapa_circulo=mapa_circulo,
                mapa_desplazamientos=req.mapa_desplazamientos,
                filtrado_EstValor=req.filtrado_EstValor,
                filtrado_EstValorDias=req.filtrado_EstValorDias,
                filtrado_Horas=req.filtrado_Horas,
                filtrado_PorcentajeEstaciones=req.filtrado_PorcentajeEstaciones,
                filtro=req.filtro,
                tipo_filtro=req.tipo_filtro,
                use_filter_for_maps=False,
                filter_result_filename=None,
            )

            return run_analysis(final_args)


        if req.use_filter_for_graphs:
            if not req.filtro or not req.tipo_filtro:
                raise HTTPException(
                    status_code=400,
                    detail="use_filter_for_graphs=true requiere campos 'filtro' y 'tipo_filtro'",
                )

            # 1) Ejecutar solo el filtro para generar fichero(s) Filtrado_*
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
                filter_result_filename=None,
            )
            _ = run_analysis(solo_filtro_args)

            # 2) Si quieres usar el resultado del filtro para barras, puedes tocar aquí
            graf_barras_est_med = req.graf_barras_est_med
            graf_barras_est_acum = req.graf_barras_est_acum


            graf_linea_comp_est = req.graf_linea_comp_est

            final_args = AnalysisArgs(
                input_folder=req.input_folder,
                output_folder=req.output_folder,
                seleccion_agregacion=req.seleccion_agregacion,
                delta_media=req.delta_media,
                delta_acumulada=req.delta_acumulada,
                graf_barras_est_med=graf_barras_est_med,
                graf_barras_est_acum=graf_barras_est_acum,
                graf_barras_dia=req.graf_barras_dia,
                graf_linea_comp_est=graf_linea_comp_est,
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
                filter_result_filename=None,
            )
            return run_analysis(final_args)

        final_args = AnalysisArgs(
            input_folder=req.input_folder,
            output_folder=req.output_folder,
            seleccion_agregacion=req.seleccion_agregacion,
            delta_media=req.delta_media,
            delta_acumulada=req.delta_acumulada,
            graf_barras_est_med=req.graf_barras_est_med,
            graf_barras_est_acum=req.graf_barras_est_acum,
            graf_barras_dia=req.graf_barras_dia,
            graf_linea_comp_est=req.graf_linea_comp_est,  # List[StationDays] | None
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
            filter_result_filename=None,
        )
        return run_analysis(final_args)


    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/exe/simular-json")
def exe_simular_json(args: SimulateArgs):
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


@app.get("/filters/result")
async def get_filter_result(
    run: str = Query(..., description="Nombre de la carpeta de simulación (simfolder)"),
    filename: str = Query(..., description="Nombre del fichero de filtrado dentro de la carpeta"),
    kind: str = Query("stations", description="'stations' | 'hours' | 'percent'"),
):
    folder = find_run_folder(run)
    if not folder:
        raise HTTPException(status_code=404, detail=f"Run not found: {run}")

    file_path = (folder / filename).resolve()
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Filter file not found: {filename}")

    text = file_path.read_text(encoding="utf-8").strip()

    if kind in ("stations", "hours"):
        numbers = parse_int_list_from_text(text)
        if kind == "stations":
            return {"stations": numbers}
        else:
            return {"hours": numbers}

    if kind == "percent":
        match = re.search(r"\d+(\.\d+)?", text)
        value = float(match.group(0)) if match else 0.0
        return {"percent": value}

    return {"raw": text}
