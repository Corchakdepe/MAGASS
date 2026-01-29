"""Map generation service."""

import logging
from pathlib import Path
from typing import List, Optional
import pandas as pd
import numpy as np
from bikesim.generators.displacement_generator import DisplacementGenerator
from bikesim.core.models import MapMetadata, AnalysisArgs
from bikesim.core.exceptions import MapGenerationError
from bikesim.utils.parsers import parse_map_spec, parse_video_spec
from Backend.Representacion.Mapas.MapaDensidad import MapaDensidad2
from Backend.Representacion.ManejadorMapas.manejar_Voronoi import manejar_Voronoi
from Backend.Representacion.ManejadorMapas.manejar_mapaCirculos import manejar_mapaCirculos
from Backend.Auxiliares import auxiliar_ficheros

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

    def generate_all(
            self,
            matrix: pd.DataFrame,
            args: AnalysisArgs
    ) -> List[MapMetadata]:
        """
        Generate all requested maps.

        Args:
            matrix: Data matrix
            args: Analysis arguments

        Returns:
            List of map metadata
        """
        maps = []

        try:
            if args.mapa_densidad:
                maps.extend(self.generate_density_maps(matrix, args.mapa_densidad))

            if args.video_densidad:
                maps.append(self.generate_density_video(matrix, args.video_densidad))

            if args.mapa_voronoi:
                maps.extend(self.generate_voronoi_maps(matrix, args.mapa_voronoi))

            if args.mapa_circulo:
                maps.extend(self.generate_circle_maps(matrix, args.mapa_circulo))

            if args.mapa_desplazamientos:
                maps.append(self.generate_displacement_map(args))

        except Exception as e:
            logger.error(f"Error generating maps: {e}")
            raise MapGenerationError(f"Map generation failed: {e}") from e

        return maps

    def generate_density_maps(
            self,
            matrix: pd.DataFrame,
            spec: str
    ) -> List[MapMetadata]:
        """
        Generate density heatmaps for specified instants.

        Args:
            matrix: Data matrix
            spec: Specification string "instant1;instant2[+station1;station2]"

        Returns:
            List of map metadata
        """
        instants, stations, _ = parse_map_spec(spec)

        mapa = MapaDensidad2(self.coordinates)
        mapa.cargarDatos(matrix, stations or [])

        maps = []

        for instant in instants:
            mapa.representarHeatmap(instante=instant)

            # Generate filename
            base_png = auxiliar_ficheros.formatoArchivo(
                f"Heatmap_instante{instant}",
                "png"
            )

            # Save data CSV
            df_frame = pd.DataFrame({
                "station_id": np.arange(matrix.shape[1]),
                "t": instant,
                "value": matrix.iloc[instant, :].tolist(),
            })
            csv_path = self.output_folder / base_png.replace(".png", ".csv")
            df_frame.to_csv(csv_path, index=False)

            # Create metadata
            maps.append(MapMetadata(
                id=f"density_{instant}",
                kind="density",
                format="html",
                name=f"Density Map t={instant}",
                url=f"/{base_png}",
                instant=instant,
                stations=stations
            ))

            logger.info(f"Generated density map for instant {instant}")

        return maps

    def generate_density_video(
            self,
            matrix: pd.DataFrame,
            spec: str
    ) -> MapMetadata:
        """
        Generate density heatmap video.

        Args:
            matrix: Data matrix
            spec: Specification string "start:end[+station1;station2]"

        Returns:
            Map metadata
        """
        start_instant, end_instant, stations, stations_text = parse_video_spec(spec)

        if end_instant is None:
            end_instant = len(matrix) - 1

        mapa = MapaDensidad2(self.coordinates)
        mapa.cargarDatos(matrix, stations or [])

        # Generate filename
        video_name = auxiliar_ficheros.formatoArchivo(
            f"video_densidad_{start_instant}_{end_instant}_{stations_text}",
            "mp4"
        )

        video_path = self.output_folder / video_name
        mapa.realizarVideoHeatmap(
            start_instant,
            end_instant,
            rutaSalida=str(video_path)
        )

        # Save data CSV
        rows = []
        for t in range(start_instant, end_instant + 1):
            vals = matrix.iloc[t, :].tolist()
            for sid, v in enumerate(vals):
                rows.append((t, sid, v))

        df = pd.DataFrame(rows, columns=["t", "station_id", "value"])
        csv_path = self.output_folder / video_name.replace(".mp4", ".csv")
        df.to_csv(csv_path, index=False)

        logger.info(f"Generated density video from {start_instant} to {end_instant}")

        return MapMetadata(
            id=f"density_video_{start_instant}_{end_instant}",
            kind="density",
            format="html",
            name=f"Density Video {start_instant}-{end_instant}",
            url=f"/{video_name}",
            instant=start_instant,
            stations=stations
        )

    def generate_voronoi_maps(
            self,
            matrix: pd.DataFrame,
            spec: str
    ) -> List[MapMetadata]:
        """
        Generate Voronoi maps for specified instants.

        Args:
            matrix: Data matrix
            spec: Specification string "instant1;instant2"

        Returns:
            List of map metadata
        """
        instants = list(map(int, spec.split(";")))

        maps = []

        for instant in instants:
            man_vor = manejar_Voronoi(matrix, self.coordinates)
            man_vor.cargarMapaInstante(instant)

            nombre_png = auxiliar_ficheros.formatoArchivo(
                f"MapaVoronoi_instante{instant}",
                "png"
            )

            png_path = self.output_folder / nombre_png
            man_vor.realizarFoto(str(png_path))

            # Save data CSV
            df = pd.DataFrame({
                "station_id": np.arange(matrix.shape[1]),
                "t": instant,
                "value": matrix.iloc[instant, :].tolist(),
            })
            csv_path = self.output_folder / nombre_png.replace(".png", ".csv")
            df.to_csv(csv_path, index=False)

            maps.append(MapMetadata(
                id=f"voronoi_{instant}",
                kind="voronoi",
                format="png",
                name=f"Voronoi Map t={instant}",
                url=f"/{nombre_png}",
                instant=instant
            ))

            logger.info(f"Generated Voronoi map for instant {instant}")

        return maps

    def generate_circle_maps(
            self,
            matrix: pd.DataFrame,
            spec: str
    ) -> List[MapMetadata]:
        """
        Generate circle maps for specified instants.

        Args:
            matrix: Data matrix
            spec: Specification string "instant1;instant2[+station1;station2][-L]"

        Returns:
            List of map metadata
        """
        instants, stations, show_labels = parse_map_spec(spec)

        maps = []

        for instant in instants:
            man_circulos = manejar_mapaCirculos(
                matrix,
                self.coordinates,
                mostrarLabels=show_labels,
                listaEstaciones=stations
            )

            man_circulos.cargarMapaInstante(instant, listaEstaciones=stations)

            nombre_png = auxiliar_ficheros.formatoArchivo(
                f"MapaCirculo_instante{instant}",
                "png"
            )

            png_path = self.output_folder / nombre_png
            man_circulos.realizarFoto(str(png_path))

            # Save data CSV
            if stations is None:
                station_ids = np.arange(matrix.shape[1])
                values = matrix.iloc[instant, :].tolist()
            else:
                station_ids = stations
                values = matrix.iloc[instant, stations].tolist()

            df = pd.DataFrame({
                "station_id": station_ids,
                "t": instant,
                "value": values,
            })
            csv_path = self.output_folder / nombre_png.replace(".png", ".csv")
            df.to_csv(csv_path, index=False)

            maps.append(MapMetadata(
                id=f"circle_{instant}",
                kind="circle",
                format="png",
                name=f"Circle Map t={instant}",
                url=f"/{nombre_png}",
                instant=instant,
                stations=stations
            ))

            logger.info(f"Generated circle map for instant {instant}")

        return maps

    def generate_displacement_map(self, args: AnalysisArgs) -> MapMetadata:
        """
        Generate displacement map.

        Args:
            args: Analysis arguments containing displacement spec

        Returns:
            Map metadata
        """

        gen = DisplacementGenerator(self.output_folder, args.input_folder)
        return gen.generate(args.mapa_desplazamientos)
