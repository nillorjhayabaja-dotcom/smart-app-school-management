import pytest

from app.services.ml.interfaces import PredictionInput
from app.services.ml.risk_service import RiskAssessmentService
from app.ml.models.risk.risk_scoring import weighted_risk_score


def test_weighted_risk_score_contract_clamps_and_outputs_range():
    out = weighted_risk_score(
        workload=1.2,  # should clamp
        satisfaction=-0.4,  # should clamp
        resignations=0.5,
        performance=0.6,
        student_feedback=0.1,
        weights=None,
    )

    assert 0.0 <= out.score <= 100.0
    assert out.level in {"low", "medium", "high"}
    assert isinstance(out.explanation, list)
    assert all(isinstance(x, dict) for x in out.explanation)


@pytest.mark.asyncio
async def test_risk_assessment_contract_empty_input():
    svc = RiskAssessmentService()
    out = await svc.assess_risk(PredictionInput(payload={}))

    assert "data" in out
    assert set(out["data"].keys()) == {"score", "level", "explanation"}
    assert out["data"]["score"] == 0.0
    assert out["data"]["level"] == "insufficient_data"
    assert isinstance(out["data"]["explanation"], list)
    assert "meta" in out


@pytest.mark.asyncio
async def test_risk_assessment_contract_with_valid_payload():
    svc = RiskAssessmentService()

    payload = {
        "workload": 0.8,
        "satisfaction": 0.2,
        "resignations": 0.4,
        "performance": 0.6,
        "student_feedback": 0.3,
    }

    out = await svc.assess_risk(PredictionInput(payload=payload))

    assert "data" in out
    assert "meta" in out

    data = out["data"]
    assert isinstance(data["score"], float)
    assert data["level"] in {"low", "medium", "high"}
    assert isinstance(data["explanation"], list)
    assert len(data["explanation"]) >= 5

