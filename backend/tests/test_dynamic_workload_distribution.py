import pytest

from app.services.ml.interfaces import PredictionInput
from app.services.ml.workload_distribution_service import dynamic_workload_distribution


@pytest.mark.asyncio
async def test_dynamic_workload_distribution_contract_empty_payload():
    out = await dynamic_workload_distribution(PredictionInput(payload={}))
    assert isinstance(out, dict)
    assert out["data"] == []

