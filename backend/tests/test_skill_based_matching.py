import pytest

from app.services.ml.interfaces import PredictionInput
from app.services.ml.matching_service import skill_based_matching


@pytest.mark.asyncio
async def test_skill_based_matching_contract_empty_payload():
    out = await skill_based_matching(PredictionInput(payload={}))
    assert isinstance(out, dict)
    assert "data" in out
    assert out["data"] == []

