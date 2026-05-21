from fastapi import APIRouter

from app.ml.utils.json_serializable import to_jsonable
from app.services.ml.interfaces import PredictionInput
from app.services.ml.risk_service import RiskAssessmentService

router = APIRouter()


@router.post("/assess")
async def assess_risk(payload: dict) -> dict:
    """Module 4: Risk assessment.

    Accepts payload with keys:
    workload, satisfaction, resignations, performance, student_feedback
    """
    svc = RiskAssessmentService()
    return await svc.assess_risk(PredictionInput(payload=payload))


@router.get("/heatmap")
async def risk_heatmap() -> dict:
    # UI expects rows: {department, low, medium, high}
    # Keep stubbed until analytics/workload data is wired to this endpoint.
    return {
        "data": [
            {"department": "Mathematics", "low": 4, "medium": 2, "high": 3},
            {"department": "Science", "low": 6, "medium": 1, "high": 2},
            {"department": "English", "low": 7, "medium": 2, "high": 0},
        ]
    }


