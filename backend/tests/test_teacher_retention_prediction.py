import numpy as np
import pandas as pd
import pytest

from app.services.ml.interfaces import PredictionInput
from app.services.ml.retention_service import TeacherRetentionPredictionService


@pytest.mark.asyncio
async def test_teacher_retention_forecast_contract_empty_input():
    svc = TeacherRetentionPredictionService()
    out = await svc.predict_retention(PredictionInput(payload={}))

    assert "retention" in out
    assert "resignation" in out
    assert "hiring" in out
    assert "meta" in out

    assert set(out["retention"].keys()) == {"value"}
    assert set(out["resignation"].keys()) == {"probability"}
    assert set(out["hiring"].keys()) == {"required"}

    assert isinstance(out["retention"]["value"], float)
    assert isinstance(out["resignation"]["probability"], float)
    assert isinstance(out["hiring"]["required"], int)


@pytest.mark.asyncio
async def test_teacher_retention_forecast_contract_with_history_and_future():
    # Minimal synthetic training set
    months = ["2025-01", "2025-02", "2025-03", "2025-04", "2025-05"]
    history = []
    for i, m in enumerate(months):
        history.append(
            {
                "month": m,
                "salary_ratio": 0.8 + 0.01 * i,
                "workload_per_teacher": 10 + i,
                "training_hours": 2 + (i % 2),
                "satisfaction": 0.6 + 0.02 * i,
                "student_teacher_ratio": 15 - i,
                "retention": 0.9 - 0.03 * i,
            }
        )

    future_features = []
    for i in range(3):
        future_features.append(
            {
                "month": f"2025-{6+i:02d}",
                "salary_ratio": 0.85 + 0.01 * i,
                "workload_per_teacher": 12 + i,
                "training_hours": 2 + (i % 2),
                "satisfaction": 0.65 + 0.02 * i,
                "student_teacher_ratio": 14 - i,
            }
        )

    svc = TeacherRetentionPredictionService()
    payload = {
        "history": history,
        "future_features": future_features,
        "current_teachers": 50,
        "target_teacher_count": 55,
    }

    out = await svc.predict_retention(PredictionInput(payload=payload))

    assert "retention" in out
    assert "resignation" in out
    assert "hiring" in out

    assert isinstance(out["retention"]["value"], float)
    assert isinstance(out["resignation"]["probability"], float)
    assert isinstance(out["hiring"]["required"], int)

    # Basic sanity: resignation probability should be within [0,1] due to clamping
    assert 0.0 <= out["resignation"]["probability"] <= 1.0

