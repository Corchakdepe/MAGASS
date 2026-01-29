"""Service for simulation management."""

import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime

from bikesim.core.models import SimulationMetadata, SimulationParams
from bikesim.core.exceptions import SimulationNotFoundError
from bikesim.repositories.simulation_repository import SimulationRepository
from bikesim.config.settings import AppConfig
from bikesim.utils.file_utils import create_timestamp

logger = logging.getLogger(__name__)


class SimulationService:
    """Handles simulation-related business logic."""

    def __init__(self, config: AppConfig):
        """
        Initialize service.

        Args:
            config: Application configuration
        """
        self.config = config
        self.repository = SimulationRepository(
            config.results_folder,
            config.history_file
        )

    def list_simulations(self) -> List[SimulationMetadata]:
        """
        Get all simulations with metadata.

        Returns:
            List of simulation metadata
        """
        folders = self.repository.list_all()
        history = self.repository.load_history()

        # Create lookup dictionary for metadata
        meta_by_folder = {
            s.simfolder: s for s in history.simulations
        }

        simulations = []
        for folder in folders:
            folder_info = self.repository.get_folder_info(folder)
            meta = meta_by_folder.get(folder.name, SimulationMetadata(
                simname=folder.name,
                simfolder=folder.name,
                simdataId=folder.name
            ))

            # Merge folder info with metadata
            sim_data = meta.dict()
            sim_data.update(folder_info)

            simulations.append(SimulationMetadata(**sim_data))

        return simulations

    def get_simulation(self, folder_name: str) -> SimulationMetadata:
        """
        Get single simulation by folder name.

        Args:
            folder_name: Simulation folder name

        Returns:
            Simulation metadata

        Raises:
            SimulationNotFoundError: If simulation not found
        """
        folder = self.repository.find_by_folder_name(folder_name)
        if not folder:
            raise SimulationNotFoundError(folder_name)

        # Try to get from history first
        meta = self.repository.get_from_history(folder_name)
        if meta:
            folder_info = self.repository.get_folder_info(folder)
            sim_data = meta.dict()
            sim_data.update(folder_info)
            return SimulationMetadata(**sim_data)

        # Create basic metadata from folder
        folder_info = self.repository.get_folder_info(folder)
        return SimulationMetadata(
            simname=folder_name,
            simfolder=folder_name,
            simdataId=folder_name,
            **folder_info
        )

    def get_latest_simulation(self) -> Optional[SimulationMetadata]:
        """
        Get most recent simulation.

        Returns:
            Latest simulation metadata or None
        """
        folder = self.repository.find_latest()
        if not folder:
            return None

        return self.get_simulation(folder.name)

    def create_simulation_folder(
            self,
            params: SimulationParams
    ) -> SimulationMetadata:
        """
        Create new simulation folder with metadata.

        Args:
            params: Simulation parameters

        Returns:
            Created simulation metadata
        """
        # Generate folder name
        timestamp = create_timestamp()
        folder_name = (
            f"{timestamp}_sim_"
            f"ST{params.stress_type}_"
            f"S{params.stress:.2f}_"
            f"WC{params.walk_cost:.2f}_"
            f"D{params.delta}"
        )

        # Create folder
        folder_path = self.repository.create_folder(folder_name)

        # Create metadata
        metadata = SimulationMetadata(
            simname=params.simname or folder_name,
            simfolder=folder_name,
            cityname=params.cityname,
            numberOfStations=params.number_of_stations,
            numberOfBikes=params.number_of_bikes,
            simdata=params.simdata or {},
            simdataId=folder_name,
            path=str(folder_path)
        )

        # Save to history
        self.repository.add_to_history(metadata)

        logger.info(f"Created simulation folder: {folder_name}")
        return metadata

    def update_simulation_metadata(
            self,
            folder_name: str,
            **updates
    ) -> SimulationMetadata:
        """
        Update simulation metadata.

        Args:
            folder_name: Simulation folder name
            **updates: Fields to update

        Returns:
            Updated metadata
        """
        metadata = self.get_simulation(folder_name)

        # Update fields
        for key, value in updates.items():
            if hasattr(metadata, key):
                setattr(metadata, key, value)

        # Save to history
        self.repository.add_to_history(metadata)

        return metadata

    def get_summary_file(self, folder_name: Optional[str] = None) -> Optional[Path]:
        """
        Get path to simulation summary file.

        Args:
            folder_name: Simulation folder name (None for latest)

        Returns:
            Path to summary file or None
        """
        from bikesim.config.constants import PATTERN_SUMMARY

        if folder_name:
            folder = self.repository.find_by_folder_name(folder_name)
        else:
            folder = self.repository.find_latest()

        if not folder:
            return None

        summary_files = list(folder.glob(PATTERN_SUMMARY))
        return summary_files[0] if summary_files else None

    def enrich_with_upload_info(self) -> None:
        """
        Enrich simulation history with station/bike info from uploads.

        This looks at the most recent upload CSV to extract city name,
        station count, and bike count, then updates any simulations
        in history that are missing this information.
        """
        city, num_stations, num_bikes = self._extract_upload_info()

        if city is None:
            return

        history = self.repository.load_history()
        changed = False

        for sim in history.simulations:
            if sim.cityname is None:
                sim.cityname = city
                changed = True
            if sim.numberOfStations is None and num_stations is not None:
                sim.numberOfStations = num_stations
                changed = True
            if sim.numberOfBikes is None and num_bikes is not None:
                sim.numberOfBikes = num_bikes
                changed = True

        if changed:
            self.repository.save_history(history)

    def _extract_upload_info(self):
        """
        Extract city, station count, and bike count from latest upload CSV.

        Returns:
            Tuple of (city_name, num_stations, num_bikes)
        """
        import csv
        from bikesim.config.constants import UPLOAD_CSV_SUFFIX

        folder = self.config.uploads_folder

        try:
            files = [
                f for f in folder.iterdir()
                if f.name.endswith(UPLOAD_CSV_SUFFIX)
            ]
        except FileNotFoundError:
            return None, None, None

        if not files:
            return None, None, None

        # Get most recent file
        latest_file = sorted(files)[-1]

        # Extract city from filename
        base = latest_file.stem
        city = base.split("_", 1)[0]

        # Read CSV to count stations and bikes
        try:
            with open(latest_file, newline="", encoding="utf-8") as csvfile:
                reader = csv.reader(csvfile)
                rows = list(reader)

                if len(rows) < 2:
                    return city, None, None

                # First row: station IDs, second row: bike counts
                station_numbers = [int(x) for x in rows[0] if x.strip().isdigit()]
                bike_counts = [int(x) for x in rows[1] if x.strip().isdigit()]

                num_stations = len(station_numbers)
                num_bikes = sum(bike_counts) if bike_counts else None

                return city, num_stations, num_bikes
        except Exception as e:
            logger.error(f"Error reading upload CSV: {e}")
            return city, None, None
