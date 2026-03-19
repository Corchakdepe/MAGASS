"""Repository for simulation data access."""

import json
import logging
from pathlib import Path
from typing import Optional, List
from datetime import datetime

from bikesim.core.models import SimulationMetadata, SimulationHistory
from bikesim.core.exceptions import SimulationNotFoundError, FileOperationError
from bikesim.config.constants import PATTERN_SIM_FOLDER

logger = logging.getLogger(__name__)


class SimulationRepository:
    """Handles persistence and retrieval of simulation data."""

    def __init__(self, base_folder: Path, history_file: Path):
        """
        Initialize repository.

        Args:
            base_folder: Base folder for simulation results
            history_file: Path to history JSON file
        """
        self.base_folder = base_folder
        self.history_file = history_file

        # Ensure folders exist
        self.base_folder.mkdir(exist_ok=True, parents=True)

    def find_by_folder_name(self, name: str) -> Optional[Path]:
        """
        Find simulation folder by name.

        Args:
            name: Folder name

        Returns:
            Path to folder or None if not found
        """
        folder = self.base_folder / name
        return folder if folder.exists() and folder.is_dir() else None

    def find_latest(self) -> Optional[Path]:
        """
        Find most recently modified simulation folder.

        Returns:
            Path to latest folder or None
        """
        folders = [
            f for f in self.base_folder.glob(PATTERN_SIM_FOLDER)
            if f.is_dir()
        ]

        if not folders:
            return None

        latest = max(folders, key=lambda x: x.stat().st_mtime)
        logger.info(f"Latest simulation folder: {latest}")
        return latest

    def list_all(self) -> List[Path]:
        """
        List all simulation folders.

        Returns:
            List of simulation folder paths
        """
        folders = [
            f for f in self.base_folder.glob(PATTERN_SIM_FOLDER)
            if f.is_dir()
        ]
        return sorted(folders, key=lambda x: x.stat().st_mtime, reverse=True)

    def load_history(self) -> SimulationHistory:
        """
        Load simulation history from JSON file.

        Returns:
            SimulationHistory object
        """
        if not self.history_file.exists():
            return SimulationHistory(simulations=[])

        try:
            with open(self.history_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                return SimulationHistory.parse_obj(data)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse history file: {e}")
            return SimulationHistory(simulations=[])
        except Exception as e:
            logger.error(f"Failed to load history: {e}")
            raise FileOperationError(f"Could not load history: {e}") from e

    def save_history(self, history: SimulationHistory) -> None:
        """
        Save simulation history to JSON file.

        Args:
            history: SimulationHistory to save
        """
        try:
            self.history_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.history_file, "w", encoding="utf-8") as f:
                json.dump(
                    history.dict(),
                    f,
                    indent=2,
                    ensure_ascii=False
                )
        except Exception as e:
            logger.error(f"Failed to save history: {e}")
            raise FileOperationError(f"Could not save history: {e}") from e

    def add_to_history(self, metadata: SimulationMetadata) -> None:
        """
        Add or update simulation in history.

        Args:
            metadata: Simulation metadata
        """
        history = self.load_history()

        # Remove existing entry for this folder (update scenario)
        history.simulations = [
            s for s in history.simulations
            if s.simfolder != metadata.simfolder
        ]

        # Add new entry
        history.simulations.append(metadata)

        self.save_history(history)

    def get_from_history(self, folder_name: str) -> Optional[SimulationMetadata]:
        """
        Get simulation metadata from history.

        Args:
            folder_name: Simulation folder name

        Returns:
            SimulationMetadata or None
        """
        history = self.load_history()
        for sim in history.simulations:
            if sim.simfolder == folder_name:
                return sim
        return None

    def create_folder(self, folder_name: str) -> Path:
        """
        Create new simulation folder.

        Args:
            folder_name: Name for the folder

        Returns:
            Path to created folder
        """
        folder_path = self.base_folder / folder_name
        folder_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"Created simulation folder: {folder_path}")
        return folder_path

    def get_folder_info(self, folder_path: Path) -> dict:
        """
        Get information about a simulation folder.

        Args:
            folder_path: Path to folder

        Returns:
            Dictionary with folder information
        """
        if not folder_path.exists():
            raise SimulationNotFoundError(str(folder_path))

        stat = folder_path.stat()
        created = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
        file_count = len(list(folder_path.glob("*")))

        return {
            "path": str(folder_path),
            "created": created,
            "file_count": file_count
        }
