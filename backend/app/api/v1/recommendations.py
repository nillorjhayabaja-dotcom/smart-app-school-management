from fastapi import APIRouter

router = APIRouter()


@router.post("")
async def list_recommendations(payload: dict) -> list[dict]:
    """Module 5: Automated Recommendations.

    Payload is passed to AutomatedRecommendationMLService.
    """
    from app.services.ml.interfaces import PredictionInput
    from app.services.ml.recommendation_ml_service import AutomatedRecommendationMLService

    svc = AutomatedRecommendationMLService()
    out = await svc.recommend(PredictionInput(payload=payload))
    return out["items"]



