import pytest

from app.services.ml.interfaces import PredictionInput
from app.services.ml.scheduling_service import flexible_scheduling


@pytest.mark.asyncio
async def test_flexible_scheduling_contract_empty_payload():
    out = await flexible_scheduling(PredictionInput(payload={}))
    assert isinstance(out, dict)
    assert out["data"] == []

