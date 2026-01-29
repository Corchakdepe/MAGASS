"""FastAPI dependencies for dependency injection."""

from functools import lru_cache
from bikesim.config.settings import get_config, AppConfig
from bikesim.services.simulation_service import SimulationService
from bikesim.services.analysis_service import AnalysisService


@lru_cache()
def get_app_config() -> AppConfig:
    """
    Get application configuration (cached).

    Returns:
        Application configuration
    """
    return get_config()


def get_simulation_service(config: AppConfig = None) -> SimulationService:
    """
    Get simulation service instance.

    Args:
        config: Application configuration (optional, will use default if not provided)

    Returns:
        SimulationService instance
    """
    if config is None:
        config = get_app_config()
    return SimulationService(config)


def get_analysis_service(config: AppConfig = None) -> AnalysisService:
    """
    Get analysis service instance.

    Args:
        config: Application configuration (optional)

    Returns:
        AnalysisService instance
    """
    if config is None:
        config = get_app_config()
    return AnalysisService(config)
