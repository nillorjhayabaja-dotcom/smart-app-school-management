import pytest

from app.services.ml.interfaces import PredictionInput
from app.services.ml.recommendation_ml_service import AutomatedRecommendationMLService


@pytest.mark.asyncio
async def test_automated_recommendation_contract_empty_payload():
    svc = AutomatedRecommendationMLService()
    out = await svc.recommend(PredictionInput(payload={}))

    assert "items" in out
    assert "meta" in out

    items = out["items"]
    assert isinstance(items, list)
    assert len(items) >= 1

    it0 = items[0]
    assert set(it0.keys()) == {"id", "title", "category", "impact", "description", "confidence"}
    assert isinstance(it0["id"], str)
    assert isinstance(it0["title"], str)
    assert isinstance(it0["category"], str)
    assert isinstance(it0["impact"], str)
    assert isinstance(it0["description"], str)
    assert isinstance(it0["confidence"], float)


@pytest.mark.asyncio
async def test_automated_recommendation_prefers_categories():
    svc = AutomatedRecommendationMLService()

    # Force workload overload high so we get workload balancing recommendations.
    payload = {
        "workload_overload": 0.9,
        "preferred_categories": ["Workload Balancing"],
    }

    out = await svc.recommend(PredictionInput(payload=payload))
    items = out["items"]
    assert len(items) >= 1

    # All returned items should match preferred categories.
    for it in items:
        assert it["category"].lower() in {"workload balancing"}

