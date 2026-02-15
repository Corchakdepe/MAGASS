"""Map generation service."""

import logging
from pathlib import Path
from typing import List, Optional
import pandas as pd
import numpy as np
import json
import shutil
from datetime import datetime

from bikesim.generators.displacement_generator import DisplacementGenerator
from bikesim.core.models import MapMetadata, AnalysisArgs
from bikesim.utils.parsers import parse_map_spec, parse_video_spec
from Backend.Representacion.Mapas.MapaDensidad import MapaDensidad2
from Backend.Representacion.ManejadorMapas.manejar_Voronoi import manejar_Voronoi
from Backend.Representacion.ManejadorMapas.manejar_mapaCirculos import manejar_mapaCirculos
from Backend.Representacion.ManejadorMapas.manejar_mapaCapacidades import manejar_mapaCapacidades

logger = logging.getLogger(__name__)


class MapGenerator:
    """Generates map outputs from matrix data."""

    def __init__(self, output_folder: Path, coordinates: pd.DataFrame):
        """
        Initialize generator.

        Args:
            output_folder: Folder for map outputs
            coordinates: Station coordinates DataFrame
        """
        self.output_folder = output_folder
        self.coordinates = coordinates
        self.output_folder.mkdir(exist_ok=True, parents=True)

    def _generate_base_filename(self, map_type: str, instant: int = None,
                                start_instant: int = None, end_instant: int = None,
                                stations_text: str = "", args: AnalysisArgs = None) -> str:
        """
        Generate a consistent base filename for HTML, CSV and JSON files.

        Format: YYYYMMDD_HHMMSS_MapType_instantX_D{delta_media}S0.0C0.0[_stationsX_Y_Z]
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Always use consistent parameter format: D{delta}S0.0C0.0
        if args and args.delta_media is not None:
            delta_str = f"{args.delta_media:.1f}".replace('.', '')
        else:
            delta_str = "None"

        # Always use S0.0C0.0 format consistently
        params = f"D{delta_str}S0.0C0.0"

        # Build the base filename
        if instant is not None:
            base = f"{timestamp}_{map_type}_instante{instant}{params}"
        elif start_instant is not None and end_instant is not None:
            base = f"{timestamp}_{map_type}_video_{start_instant}_{end_instant}{params}"
        else:
            base = f"{timestamp}_{map_type}{params}"

        # Add stations_text if provided (e.g., "stations12_13_15")
        if stations_text and stations_text != "_":
            base += f"_{stations_text}"

        return base

    def _save_map_metadata(
            self,
            base_path: Path,  # Path without extension (already includes stations_text)
            map_name: str,
            matrix_type: str,
            delta_media: float,
            status: str = "success",
            instant: int = None,
            stations: List[int] = None,
            start_instant: int = None,
            end_instant: int = None,
            map_kind: str = None,
            error_msg: str = None,
            additional_data: dict = None,
            stations_text: str = ""
    ) -> Path:
        """
        Save JSON metadata companion file for a map.
        Uses the same base name as the HTML file but with .json extension.

        The base_path already includes the full filename without extension,
        including any stations_text suffix.
        """
        # Create metadata dictionary
        metadata = {
            "map_name": map_name,
            "matrix_type": matrix_type,
            "delta_media": delta_media,
            "generated_at": datetime.now().isoformat(),
            "map_kind": map_kind or "unknown",
            "status": status,
            "files": {
                "html": f"{base_path.name}.html",
                "json": f"{base_path.name}.json",
                "csv": f"{base_path.name}.csv"
            }
        }

        # Add error if present
        if error_msg:
            metadata["error"] = error_msg

        # Add instant information if provided
        if instant is not None:
            metadata["instant"] = instant

        if start_instant is not None and end_instant is not None:
            metadata["start_instant"] = start_instant
            metadata["end_instant"] = end_instant

        # Add stations if provided
        if stations:
            metadata["stations"] = stations
            metadata["stations_count"] = len(stations)
        else:
            metadata["stations"] = "all"
            metadata["stations_count"] = "all"

        # Add stations_text to metadata
        if stations_text:
            metadata["stations_text"] = stations_text

        # Add any additional data
        if additional_data:
            metadata.update(additional_data)

        # Create JSON filename (same base name but .json)
        json_path = base_path.with_suffix('.json')

        # Save JSON file
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)

        logger.info(f"Saved map metadata to {json_path}")
        return json_path

    def generate_circle_maps(
            self,
            matrix: pd.DataFrame,
            spec: str,
            args: AnalysisArgs
    ) -> List[MapMetadata]:
        """
        Generate circle maps (HTML) for specified instants and create companion JSON metadata.
        Both files will have identical names (different extensions).

        Args:
            matrix: Data matrix
            spec: Specification string "instant1;instant2[+station1;station2][-L]"
            args: Analysis arguments containing user metadata

        Returns:
            List of map metadata
        """
        instants, stations, show_labels = parse_map_spec(spec)
        maps = []

        for instant in instants:
            # Calculate stations_text OUTSIDE the try block
            stations_text = ""
            if stations:
                # Format: stations12_13_15 (all stations, not just first 3)
                stations_text = f"stations{'_'.join(map(str, stations))}"

            try:
                # Generate base filename (without extension) - THIS ALREADY INCLUDES stations_text
                base_filename = self._generate_base_filename(
                    map_type="MapaCirculos",
                    instant=instant,
                    stations_text=stations_text,
                    args=args
                )

                # Create the base_path Path object (without extension)
                base_path = self.output_folder / base_filename

                # Full paths
                html_path = base_path.with_suffix('.html')
                csv_path = base_path.with_suffix('.csv')
                json_path = base_path.with_suffix('.json')

                # Initialize the map generator
                man_circulos = manejar_mapaCirculos(
                    matrix,
                    self.coordinates,
                    mostrarLabels=show_labels,
                    listaEstaciones=stations
                )

                # Generate the map
                man_circulos.cargarMapaInstante(instant, listaEstaciones=stations)

                # Get the source HTML file and copy it to our desired location
                source_html = man_circulos.getFichero()
                if source_html and Path(source_html).exists():
                    shutil.copy2(source_html, html_path)
                else:
                    html_path.touch()
                    logger.warning(f"No source HTML found for circle map instant {instant}")

                # Save data CSV
                if stations is None:
                    station_ids = np.arange(matrix.shape[1]).tolist()
                    values = matrix.iloc[instant, :].tolist()
                else:
                    station_ids = stations
                    values = matrix.iloc[instant, stations].tolist()

                df = pd.DataFrame({
                    "station_id": station_ids,
                    "t": instant,
                    "value": values,
                })
                df.to_csv(csv_path, index=False)

                # Save JSON metadata
                self._save_map_metadata(
                    base_path=base_path,
                    map_name=args.user_name_map,
                    matrix_type=args.seleccion_agregacion,
                    delta_media=args.delta_media,
                    status="success",
                    instant=instant,
                    stations=station_ids,
                    map_kind="circle",
                    stations_text=stations_text,
                    additional_data={
                        "csv_file": csv_path.name,
                        "show_labels": show_labels,
                        "total_stations_selected": len(station_ids) if stations else matrix.shape[1],
                        "data_summary": {
                            "min_value": float(min(values)),
                            "max_value": float(max(values)),
                            "mean_value": float(sum(values) / len(values)) if values else 0
                        }
                    }
                )

                maps.append(MapMetadata(
                    id=f"circle_{instant}_{base_filename}",
                    kind="circle",
                    format="html",
                    name=f"Circle Map t={instant}",
                    url=f"/{base_filename}.html",
                    instant=instant,
                    stations=station_ids,
                    file_path=str(html_path)
                ))

                logger.info(f"Generated circle map and metadata for instant {instant}: {base_filename}.html")

            except Exception as e:
                error_msg = str(e)
                logger.error(f"Error generating circle map for instant {instant}: {error_msg}")

                # Generate the SAME base filename for error case
                base_filename = self._generate_base_filename(
                    map_type="MapaCirculos",
                    instant=instant,
                    stations_text=stations_text,
                    args=args
                )

                # Create base_path for error case
                base_path = self.output_folder / base_filename

                # Create empty files with consistent names
                html_path = base_path.with_suffix('.html')
                csv_path = base_path.with_suffix('.csv')
                json_path = base_path.with_suffix('.json')

                html_path.touch()
                pd.DataFrame(columns=["station_id", "t", "value"]).to_csv(csv_path, index=False)

                # Create error JSON with same base name
                self._save_map_metadata(
                    base_path=base_path,
                    map_name=args.user_name_map,
                    matrix_type=args.seleccion_agregacion,
                    delta_media=args.delta_media,
                    status="error",
                    instant=instant,
                    stations=stations if stations else list(range(matrix.shape[1])),
                    map_kind="circle",
                    stations_text=stations_text,
                    error_msg=error_msg,
                    additional_data={
                        "show_labels": show_labels,
                        "spec": spec
                    }
                )

                maps.append(MapMetadata(
                    id=f"circle_{instant}_{base_filename}_error",
                    kind="circle",
                    format="html",
                    name=f"Circle Map t={instant} (Error)",
                    url=f"/{base_filename}.html",
                    instant=instant,
                    stations=stations if stations else list(range(matrix.shape[1])),
                    file_path=str(html_path),
                    error=error_msg
                ))

        return maps

    def generate_density_maps(
            self,
            matrix: pd.DataFrame,
            spec: str,
            args: AnalysisArgs
    ) -> List[MapMetadata]:
        """
        Generate density heatmaps (HTML) for specified instants and create companion JSON metadata.
        Both files will have identical names (different extensions).
        """
        instants, stations, _ = parse_map_spec(spec)
        maps = []

        for instant in instants:
            # Calculate stations_text OUTSIDE the try block
            stations_text = ""
            if stations:
                stations_text = f"stations{'_'.join(map(str, stations))}"

            try:
                # Generate base filename
                base_filename = self._generate_base_filename(
                    map_type="Heatmap",
                    instant=instant,
                    stations_text=stations_text,
                    args=args
                )

                # Create base_path
                base_path = self.output_folder / base_filename
                html_path = base_path.with_suffix('.html')
                csv_path = base_path.with_suffix('.csv')

                # Generate map
                mapa = MapaDensidad2(self.coordinates)
                mapa.cargarDatos(matrix, stations or [])
                mapa.representarHeatmap(instante=instant)

                # Get source file and copy
                source_html = mapa.getFichero()
                if source_html and Path(source_html).exists():
                    shutil.copy2(source_html, html_path)

                # Save data CSV
                df_frame = pd.DataFrame({
                    "station_id": np.arange(matrix.shape[1]),
                    "t": instant,
                    "value": matrix.iloc[instant, :].tolist(),
                })
                df_frame.to_csv(csv_path, index=False)

                values = matrix.iloc[instant, :].tolist()

                # Save JSON metadata
                self._save_map_metadata(
                    base_path=base_path,
                    map_name=args.user_name_map,
                    matrix_type=args.seleccion_agregacion,
                    delta_media=args.delta_media,
                    status="success",
                    instant=instant,
                    stations=stations,
                    map_kind="density",
                    stations_text=stations_text,
                    additional_data={
                        "csv_file": csv_path.name,
                        "total_instants": len(matrix),
                        "total_stations": matrix.shape[1],
                        "data_summary": {
                            "min_value": float(min(values)),
                            "max_value": float(max(values)),
                            "mean_value": float(sum(values) / len(values))
                        }
                    }
                )

                maps.append(MapMetadata(
                    id=f"density_{instant}_{base_filename}",
                    kind="density",
                    format="html",
                    name=f"Density Map t={instant}",
                    url=f"/{base_filename}.html",
                    instant=instant,
                    stations=stations,
                    file_path=str(html_path)
                ))

                logger.info(f"Generated density map for instant {instant}: {base_filename}.html")

            except Exception as e:
                error_msg = str(e)
                logger.error(f"Error generating density map for instant {instant}: {error_msg}")

                base_filename = self._generate_base_filename(
                    map_type="Heatmap",
                    instant=instant,
                    stations_text=stations_text,
                    args=args
                )

                base_path = self.output_folder / base_filename
                html_path = base_path.with_suffix('.html')
                csv_path = base_path.with_suffix('.csv')

                html_path.touch()
                pd.DataFrame(columns=["station_id", "t", "value"]).to_csv(csv_path, index=False)

                self._save_map_metadata(
                    base_path=base_path,
                    map_name=args.user_name_map,
                    matrix_type=args.seleccion_agregacion,
                    delta_media=args.delta_media,
                    status="error",
                    instant=instant,
                    stations=stations,
                    map_kind="density",
                    stations_text=stations_text,
                    error_msg=error_msg,
                    additional_data={"spec": spec}
                )

                maps.append(MapMetadata(
                    id=f"density_{instant}_{base_filename}_error",
                    kind="density",
                    format="html",
                    name=f"Density Map t={instant} (Error)",
                    url=f"/{base_filename}.html",
                    instant=instant,
                    stations=stations,
                    file_path=str(html_path),
                    error=error_msg
                ))

        return maps

    def generate_density_video(
            self,
            matrix: pd.DataFrame,
            spec: str,
            args: AnalysisArgs
    ) -> MapMetadata:
        """
        Generate density video (HTML) and create companion JSON metadata.
        Both files will have identical names (different extensions).
        """
        try:
            start_instant, end_instant, stations, stations_text = parse_video_spec(spec)

            if end_instant is None:
                end_instant = len(matrix) - 1

            # Generate base filename
            base_filename = self._generate_base_filename(
                map_type="VideoDensidad",
                start_instant=start_instant,
                end_instant=end_instant,
                stations_text=stations_text,
                args=args
            )

            base_path = self.output_folder / base_filename
            html_path = base_path.with_suffix('.html')
            csv_path = base_path.with_suffix('.csv')

            # Generate video
            mapa = MapaDensidad2(self.coordinates)
            mapa.cargarDatos(matrix, stations or [])
            mapa.realizarVideoHeatmap(
                start_instant,
                end_instant,
                rutaSalida=str(html_path)
            )

            # Save data CSV for all frames
            rows = []
            for t in range(start_instant, end_instant + 1):
                vals = matrix.iloc[t, :].tolist()
                for sid, v in enumerate(vals):
                    rows.append((t, sid, v))

            df = pd.DataFrame(rows, columns=["t", "station_id", "value"])
            df.to_csv(csv_path, index=False)

            # Collect summary for all frames
            frames_summary = []
            for t in range(start_instant, end_instant + 1):
                vals = matrix.iloc[t, :].tolist()
                frames_summary.append({
                    "instant": t,
                    "min_value": float(min(vals)),
                    "max_value": float(max(vals)),
                    "mean_value": float(sum(vals) / len(vals))
                })

            # Save JSON metadata
            self._save_map_metadata(
                base_path=base_path,
                map_name=args.user_name_map,
                matrix_type=args.seleccion_agregacion,
                delta_media=args.delta_media,
                status="success",
                start_instant=start_instant,
                end_instant=end_instant,
                stations=stations,
                map_kind="density_video",
                stations_text=stations_text,
                additional_data={
                    "csv_file": csv_path.name,
                    "total_frames": end_instant - start_instant + 1,
                    "stations_text": stations_text,
                    "frames_summary": frames_summary
                }
            )

            logger.info(f"Generated density video: {base_filename}.html")

            return MapMetadata(
                id=f"density_video_{start_instant}_{end_instant}_{base_filename}",
                kind="density",
                format="html",
                name=f"Density Video {start_instant}-{end_instant}",
                url=f"/{base_filename}.html",
                instant=start_instant,
                stations=stations,
                file_path=str(html_path)
            )

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error generating density video: {error_msg}")

            base_filename = self._generate_base_filename(
                map_type="VideoDensidad",
                start_instant=start_instant if 'start_instant' in locals() else 0,
                end_instant=end_instant if 'end_instant' in locals() else 0,
                stations_text=stations_text if 'stations_text' in locals() else "",
                args=args
            )

            base_path = self.output_folder / base_filename
            html_path = base_path.with_suffix('.html')
            csv_path = base_path.with_suffix('.csv')

            html_path.touch()
            pd.DataFrame(columns=["t", "station_id", "value"]).to_csv(csv_path, index=False)

            self._save_map_metadata(
                base_path=base_path,
                map_name=args.user_name_map,
                matrix_type=args.seleccion_agregacion,
                delta_media=args.delta_media,
                status="error",
                map_kind="density_video",
                stations_text=stations_text if 'stations_text' in locals() else "",
                error_msg=error_msg,
                additional_data={"spec": spec}
            )

            return MapMetadata(
                id=f"density_video_error_{base_filename}",
                kind="density",
                format="html",
                name="Density Video (Error)",
                url=f"/{base_filename}.html",
                file_path=str(html_path),
                error=error_msg
            )

    def generate_voronoi_maps(
            self,
            matrix: pd.DataFrame,
            spec: str,
            args: AnalysisArgs
    ) -> List[MapMetadata]:
        """
        Generate Voronoi maps (HTML) for specified instants and create companion JSON metadata.
        Both files will have identical names (different extensions).

        Args:
            matrix: Data matrix
            spec: Specification string "instant1;instant2"
            args: Analysis arguments containing user metadata

        Returns:
            List of map metadata
        """
        instants = list(map(int, spec.split(";")))
        maps = []

        for instant in instants:
            try:
                # Generate base filename
                base_filename = self._generate_base_filename(
                    map_type="MapaVoronoi",
                    instant=instant,
                    args=args
                )

                base_path = self.output_folder / base_filename
                html_path = base_path.with_suffix('.html')
                csv_path = base_path.with_suffix('.csv')

                # Generate Voronoi map
                man_vor = manejar_Voronoi(matrix, self.coordinates)
                man_vor.cargarMapaInstante(instant)

                # Get source HTML file and copy to our desired location
                source_html = man_vor.getFichero()
                if source_html and Path(source_html).exists():
                    shutil.copy2(source_html, html_path)
                else:
                    html_path.touch()
                    logger.warning(f"No source HTML found for Voronoi map instant {instant}")

                # Save data CSV
                values = matrix.iloc[instant, :].tolist()
                station_ids = np.arange(matrix.shape[1]).tolist()

                df = pd.DataFrame({
                    "station_id": station_ids,
                    "t": instant,
                    "value": values,
                })
                df.to_csv(csv_path, index=False)

                # Save JSON metadata
                self._save_map_metadata(
                    base_path=base_path,
                    map_name=args.user_name_map,
                    matrix_type=args.seleccion_agregacion,
                    delta_media=args.delta_media,
                    status="success",
                    instant=instant,
                    stations=station_ids,
                    map_kind="voronoi",
                    additional_data={
                        "csv_file": csv_path.name,
                        "total_stations": matrix.shape[1],
                        "data_summary": {
                            "min_value": float(min(values)),
                            "max_value": float(max(values)),
                            "mean_value": float(sum(values) / len(values))
                        }
                    }
                )

                maps.append(MapMetadata(
                    id=f"voronoi_{instant}_{base_filename}",
                    kind="voronoi",
                    format="html",
                    name=f"Voronoi Map t={instant}",
                    url=f"/{base_filename}.html",
                    instant=instant,
                    stations=station_ids,
                    file_path=str(html_path)
                ))

                logger.info(f"Generated Voronoi map for instant {instant}: {base_filename}.html")

            except Exception as e:
                error_msg = str(e)
                logger.error(f"Error generating Voronoi map for instant {instant}: {error_msg}")

                # Generate base filename for error case
                base_filename = self._generate_base_filename(
                    map_type="MapaVoronoi",
                    instant=instant,
                    args=args
                )

                base_path = self.output_folder / base_filename
                html_path = base_path.with_suffix('.html')
                csv_path = base_path.with_suffix('.csv')

                html_path.touch()
                pd.DataFrame(columns=["station_id", "t", "value"]).to_csv(csv_path, index=False)

                self._save_map_metadata(
                    base_path=base_path,
                    map_name=args.user_name_map,
                    matrix_type=args.seleccion_agregacion,
                    delta_media=args.delta_media,
                    status="error",
                    instant=instant,
                    stations=list(range(matrix.shape[1])),
                    map_kind="voronoi",
                    error_msg=error_msg,
                    additional_data={"spec": spec}
                )

                maps.append(MapMetadata(
                    id=f"voronoi_{instant}_{base_filename}_error",
                    kind="voronoi",
                    format="html",
                    name=f"Voronoi Map t={instant} (Error)",
                    url=f"/{base_filename}.html",
                    instant=instant,
                    stations=list(range(matrix.shape[1])),
                    file_path=str(html_path),
                    error=error_msg
                ))

        return maps

    def generate_displacement_map(self, args: AnalysisArgs) -> MapMetadata:
        """
        Generate displacement map (HTML) and create companion JSON metadata.
        Both files will have identical names (different extensions).

        Args:
            args: Analysis arguments containing displacement spec

        Returns:
            Map metadata
        """
        try:
            # Generate base filename
            base_filename = self._generate_base_filename(
                map_type="MapaDesplazamientos",
                args=args
            )

            base_path = self.output_folder / base_filename
            html_path = base_path.with_suffix('.html')
            csv_path = base_path.with_suffix('.csv')

            # Generate displacement map using existing generator
            gen = DisplacementGenerator(self.output_folder, args.input_folder)

            # Modify the generator to use our filename
            original_generate = gen.generate

            def generate_with_filename(spec):
                result = original_generate(spec)
                # Find the generated file and rename it
                map_files = list(self.output_folder.glob("MapaDesplazamientos*.html"))
                if map_files:
                    source = map_files[0]
                    if source != html_path:
                        shutil.move(source, html_path)
                return result

            # Temporarily replace the generate method
            gen.generate = generate_with_filename.__get__(gen)
            map_metadata = gen.generate(args.mapa_desplazamientos)

            # Restore original method
            gen.generate = original_generate

            # Create empty CSV (since displacement might not have typical matrix data)
            pd.DataFrame(columns=["description"]).to_csv(csv_path, index=False)

            # Save JSON metadata
            self._save_map_metadata(
                base_path=base_path,
                map_name=args.user_name_map,
                matrix_type=args.seleccion_agregacion,
                delta_media=args.delta_media,
                status="success",
                map_kind="displacement",
                additional_data={
                    "csv_file": csv_path.name,
                    "spec": args.mapa_desplazamientos
                }
            )

            logger.info(f"Generated displacement map: {base_filename}.html")

            return MapMetadata(
                id=f"displacement_{base_filename}",
                kind="displacement",
                format="html",
                name="Displacement Map",
                url=f"/{base_filename}.html",
                file_path=str(html_path)
            )

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error generating displacement map: {error_msg}")

            base_filename = self._generate_base_filename(
                map_type="MapaDesplazamientos",
                args=args
            )

            base_path = self.output_folder / base_filename
            html_path = base_path.with_suffix('.html')
            csv_path = base_path.with_suffix('.csv')

            html_path.touch()
            pd.DataFrame(columns=["error"]).to_csv(csv_path, index=False)

            self._save_map_metadata(
                base_path=base_path,
                map_name=args.user_name_map,
                matrix_type=args.seleccion_agregacion,
                delta_media=args.delta_media,
                status="error",
                map_kind="displacement",
                error_msg=error_msg,
                additional_data={
                    "spec": args.mapa_desplazamientos if args.mapa_desplazamientos else None
                }
            )

            return MapMetadata(
                id=f"displacement_error_{base_filename}",
                kind="displacement",
                format="html",
                name="Displacement Map (Error)",
                url=f"/{base_filename}.html",
                file_path=str(html_path),
                error=error_msg
            )

    def generate_capacity_map(self, args: AnalysisArgs) -> Optional[MapMetadata]:
        """
        Generate capacity map (HTML) showing station capacities and create companion JSON metadata.
        Both files will have identical names (different extensions).

        Args:
            args: Analysis arguments containing input folder path

        Returns:
            Map metadata or None if failed
        """
        try:
            # Parse spec if provided
            stations = None
            show_labels = False
            stations_text = ""

            if args.mapa_capacidad and args.mapa_capacidad != "_":
                spec = args.mapa_capacidad
                if "-L" in spec:
                    show_labels = True
                    spec = spec.replace("-L", "")

                if spec.startswith("all+"):
                    stations_part = spec.split("+")[1]
                    if stations_part:
                        stations = [int(x.strip()) for x in stations_part.split(";")]
                        stations_text = f"stations{'_'.join(map(str, stations))}"

            # Generate base filename with stations_text if applicable
            base_filename = self._generate_base_filename(
                map_type="MapaCapacidades",
                stations_text=stations_text,
                args=args
            )

            base_path = self.output_folder / base_filename
            html_path = base_path.with_suffix('.html')
            csv_path = base_path.with_suffix('.csv')

            # Load capacity data
            input_path = Path(args.input_folder)
            capacidades_file = input_path / "capacidades.csv"
            coordenadas_file = input_path / "coordenadas.csv"

            # Load capacity data
            capacidades = pd.read_csv(capacidades_file, header=None)
            logger.info(f"Loaded capacities from {capacidades_file}")

            # Load coordinates
            coordenadas_df = pd.read_csv(coordenadas_file, header=None)

            # Convert to numpy array
            if len(coordenadas_df.columns) >= 3:
                coordenadas_array = coordenadas_df.iloc[:, :3].values
            else:
                logger.warning(f"Unexpected coordinate format in {coordenadas_file}")
                coordenadas_array = coordenadas_df.values

            logger.info(f"Loaded {len(coordenadas_array)} coordinates from {coordenadas_file}")

            # Validate data
            if capacidades.iloc[0, 0] == 'header':
                num_capacities = len(capacidades) - 1
            else:
                num_capacities = len(capacidades)

            num_coordinates = len(coordenadas_array)
            num_stations = min(num_capacities, num_coordinates)

            if stations is not None:
                stations = [s for s in stations if s < num_stations]

            # Create manager and generate map
            manager = manejar_mapaCapacidades(
                capacidades=capacidades,
                coordenadas=coordenadas_array,
                mostrarLabels=show_labels,
                listaEstaciones=stations
            )

            manager.cargarMapa(listaEstaciones=stations)

            # Get source file and copy to our desired location
            source_html = manager.getFichero()
            if source_html and Path(source_html).exists():
                shutil.copy2(source_html, html_path)

            # Save combined data CSV
            if capacidades.iloc[0, 0] == 'header':
                cap_values = capacidades.iloc[1:, 0].astype(float).reset_index(drop=True)
            else:
                cap_values = capacidades.iloc[:, 0].astype(float).reset_index(drop=True)

            # Create combined DataFrame
            combined_data = []
            if stations and len(stations) > 0:
                valid_stations = [s for s in stations if s < num_stations]
                for station_id in valid_stations:
                    if station_id < len(cap_values) and station_id < len(coordenadas_array):
                        lat, lon = coordenadas_array[station_id, 1], coordenadas_array[station_id, 2]
                        combined_data.append({
                            "station_id": station_id,
                            "capacity": float(cap_values.iloc[station_id]),
                            "latitude": lat,
                            "longitude": lon
                        })
            else:
                for station_id in range(num_stations):
                    if station_id < len(cap_values) and station_id < len(coordenadas_array):
                        lat, lon = coordenadas_array[station_id, 1], coordenadas_array[station_id, 2]
                        combined_data.append({
                            "station_id": station_id,
                            "capacity": float(cap_values.iloc[station_id]),
                            "latitude": lat,
                            "longitude": lon
                        })

            df = pd.DataFrame(combined_data)
            df.to_csv(csv_path, index=False)

            # Calculate capacity statistics
            capacities_list = df['capacity'].tolist() if not df.empty else []

            # Save JSON metadata
            self._save_map_metadata(
                base_path=base_path,
                map_name=args.user_name_map,
                matrix_type=args.seleccion_agregacion,
                delta_media=args.delta_media,
                status="success",
                map_kind="capacity",
                stations=stations if stations else list(range(num_stations)),
                stations_text=stations_text,
                additional_data={
                    "csv_file": csv_path.name,
                    "show_labels": show_labels,
                    "stations_count": len(df),
                    "capacity_range": [float(min(capacities_list)),
                                       float(max(capacities_list))] if capacities_list else [0, 0],
                    "total_capacity": float(sum(capacities_list)) if capacities_list else 0,
                    "average_capacity": float(sum(capacities_list) / len(capacities_list)) if capacities_list else 0
                }
            )

            logger.info(f"Generated capacity map with {len(df)} stations: {base_filename}.html")

            return MapMetadata(
                id=f"capacity_{base_filename}",
                kind="capacity",
                format="html",
                name="Station Capacity Map",
                url=f"/{base_filename}.html",
                file_path=str(html_path),
                stations=stations if stations else list(range(num_stations))
            )

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error generating capacity map: {error_msg}")

            base_filename = self._generate_base_filename(
                map_type="MapaCapacidades",
                args=args
            )

            base_path = self.output_folder / base_filename
            html_path = base_path.with_suffix('.html')
            csv_path = base_path.with_suffix('.csv')

            html_path.touch()
            pd.DataFrame(columns=["error"]).to_csv(csv_path, index=False)

            self._save_map_metadata(
                base_path=base_path,
                map_name=args.user_name_map if args else "unknown",
                matrix_type=args.seleccion_agregacion if args else "unknown",
                delta_media=args.delta_media if args else 0,
                status="error",
                map_kind="capacity",
                error_msg=error_msg,
                additional_data={
                    "input_folder": str(args.input_folder) if args else None,
                    "spec": args.mapa_capacidad if args and args.mapa_capacidad else None
                }
            )

            return MapMetadata(
                id=f"capacity_error_{base_filename}",
                kind="capacity",
                format="html",
                name="Station Capacity Map (Error)",
                url=f"/{base_filename}.html",
                file_path=str(html_path),
                error=error_msg
            )