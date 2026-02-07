"""Simulation and analysis execution routes."""

import logging
import os
from fastapi import APIRouter, HTTPException, Depends

from bikesim.core.models import SimulationParams, AnalysisRequest
from bikesim.services.simulation_service import SimulationService
from bikesim.api.dependencies import get_simulation_service
from bikesim.analysis.runner import run_analysis  # Use new runner
from Frontend.simulation_runner import run_simulation

logger = logging.getLogger(__name__)
router = APIRouter()


