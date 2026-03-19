from __future__ import annotations

from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Define base paths
ROOT_DIR = Path(__file__).parent.parent.parent  # Project root
RESULTS_BASE_FOLDER = ROOT_DIR / "results"
UPLOADS_FOLDER = ROOT_DIR / "uploads"

class AppConfig(BaseSettings):
    """Application configuration with environment variable support."""

    # Path configurations with defaults
    root_dir: Path = Field(default=ROOT_DIR)
    results_folder: Path = Field(default=RESULTS_BASE_FOLDER)
    uploads_folder: Path = Field(default=UPLOADS_FOLDER)
    history_file: Path = Field(default=RESULTS_BASE_FOLDER / "simulations_history.json")

    # Other settings
    database_host: str = Field(default="localhost")
    database_port: int = Field(default=3306)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"  # Ignore extra env vars
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Create directories if they don't exist
        self.results_folder.mkdir(exist_ok=True, parents=True)
        self.uploads_folder.mkdir(exist_ok=True, parents=True)

# Singleton pattern
_config: AppConfig | None = None

def get_config() -> AppConfig:
    """Get or create application config singleton."""
    global _config
    if _config is None:
        _config = AppConfig()
    return _config
