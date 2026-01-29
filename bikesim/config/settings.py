"""Application configuration."""

from pathlib import Path
from typing import Dict, List
from pydantic import BaseSettings, Field


class AppConfig(BaseSettings):
    """Application configuration loaded from environment."""

    # Paths
    root_dir: Path = Field(default_factory=lambda: Path.cwd())
    results_folder: Path = Field(default=None)
    uploads_folder: Path = Field(default=None)
    history_file: Path = Field(default=None)

    # API
    allowed_origins: str = "http://localhost:3000,http://localhost:8000"
    api_title: str = "BikeSim API"
    api_version: str = "1.0"

    # Analysis defaults
    default_delta_time: int = 15
    max_stations: int = 1000

    # Map configuration
    map_types: Dict[str, str] = {
        "density": "MapaDensidad",
        "circles": "MapaCirculos",
        "voronoi": "MapaVoronoi",
        "displacement": "MapaDesplazamientos",
        "espera": "MapaEspera",
    }

    map_formats: List[str] = ["html", "png"]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        # Set default paths based on root_dir
        if self.results_folder is None:
            self.results_folder = self.root_dir / "results"
        if self.uploads_folder is None:
            self.uploads_folder = self.root_dir / "uploads"
        if self.history_file is None:
            self.history_file = self.results_folder / "simulations_history.json"

        # Ensure directories exist
        self.results_folder.mkdir(exist_ok=True, parents=True)
        self.uploads_folder.mkdir(exist_ok=True, parents=True)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        env_prefix = "BIKESIM_"


# Singleton instance
_config: AppConfig = None


def get_config() -> AppConfig:
    """Get application configuration singleton."""
    global _config
    if _config is None:
        _config = AppConfig()
    return _config
