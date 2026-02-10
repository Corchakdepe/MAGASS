"""Map generation management."""

import logging
from pathlib import Path
from typing import List
import pandas as pd

from bikesim.core.models import AnalysisArgs, MapMetadata
from bikesim.generators.map_generator import MapGenerator

logger = logging.getLogger(__name__)


class MapManager:
    """Manages map generation workflow."""

    def __init__(self, output_folder: Path, coordinates: pd.DataFrame):
        """
        Initialize manager.

        Args:
            output_folder: Output folder for maps
            coordinates: Station coordinates DataFrame
        """
        self.output_folder = output_folder
        self.coordinates = coordinates
        self.generator = MapGenerator(output_folder, coordinates)

    def generate_all_maps(
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
            # Density maps (heatmaps)
            if args.mapa_densidad:
                density_maps = self.generator.generate_density_maps(
                    matrix,
                    args.mapa_densidad
                )
                maps.extend(density_maps)
                logger.info(f"Generated {len(density_maps)} density maps")

            # Density video
            if args.video_densidad:
                video_map = self.generator.generate_density_video(
                    matrix,
                    args.video_densidad
                )
                maps.append(video_map)
                logger.info(f"Generated density video: {video_map.id}")

            # Voronoi maps
            if args.mapa_voronoi:
                voronoi_maps = self.generator.generate_voronoi_maps(
                    matrix,
                    args.mapa_voronoi
                )
                maps.extend(voronoi_maps)
                logger.info(f"Generated {len(voronoi_maps)} Voronoi maps")

            # Circle maps
            if args.mapa_circulo:
                circle_maps = self.generator.generate_circle_maps(
                    matrix,
                    args.mapa_circulo
                )
                maps.extend(circle_maps)
                logger.info(f"Generated {len(circle_maps)} circle maps")

            # Displacement map
            if args.mapa_desplazamientos:
                displacement_map = self.generator.generate_displacement_map(args)
                maps.append(displacement_map)
                logger.info(f"Generated displacement map: {displacement_map.id}")

            if args.mapa_capacidad:
                capacity_map = self.generator.generate_capacity_map(args)
                maps.append(capacity_map)
                logger.info(f"Generated capacity map: {capacity_map.id}")



        except Exception as e:
            logger.error(f"Error generating maps: {e}", exc_info=True)

        logger.info(f"Generated {len(maps)} maps total")
        return maps
