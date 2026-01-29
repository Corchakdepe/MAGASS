"""Analysis execution API routes."""

import logging
from fastapi import APIRouter, HTTPException, Depends

from bikesim.core.models import AnalysisRequest, AnalysisResult
from bikesim.services.analysis_service import AnalysisService
from bikesim.api.dependencies import get_analysis_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/execute", response_model=AnalysisResult)
async def execute_analysis(
        request: AnalysisRequest,
        service: AnalysisService = Depends(get_analysis_service)
):
    """
    Execute analysis with given parameters.

    Args:
        request: Analysis request parameters

    Returns:
        Analysis result with charts, maps, and filters
    """
    try:
        logger.info(f"Executing analysis: {request.input_folder}")
        result = service.run_analysis(request)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis execution failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Analysis execution failed: {str(e)}"
        )
