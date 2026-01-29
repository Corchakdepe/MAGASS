import asyncio
import logging
from http.client import HTTPException
from idlelib.query import Query

from starlette.responses import HTMLResponse
from Frontend.analysis_models import AnalysisArgs
from bikesim.analysis import run_analysis
from bikesim.api.routes.simulations import router
from bikesim.utils.file_utils import find_run_folder
from bikesim.utils.historymanagement import load_history, enrich_history_with_station_info


@router.get("/dashboard/initial-data")
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


@router.get("/dashboard/stations-map")
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