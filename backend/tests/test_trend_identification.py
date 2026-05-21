import pytest

from app.ml.models.trends.analysis import analyze_class_size_vs_performance
from app.services.ml.interfaces import PredictionInput
from app.services.ml.trend_analysis_service import TrendIdentificationService


def test_analyze_class_size_vs_performance_insufficient_data():
    with pytest.raises(ValueError):
        analyze_class_size_vs_performance([1, 2], [1, 2])


@pytest.mark.asyncio
async def test_trend_identification_contract_empty_input():
    svc = TrendIdentificationService()
    out = await svc.identify_trend(PredictionInput(payload={}))

    assert "data" in out
    assert "meta" in out

    data = out["data"]
    assert set(data.keys()) == {
        "correlation",
        "regression_slope",
        "p_value",
        "trend_classification",
    }

    assert isinstance(data["correlation"], float)
    assert isinstance(data["regression_slope"], float)
    assert isinstance(data["p_value"], float)
    assert isinstance(data["trend_classification"], str)


@pytest.mark.asyncio
async def test_trend_identification_positive_trend_sanity():
    # Construct a strong positive linear relationship.
    x = [1, 2, 3, 4, 5, 6]
    y = [2, 4, 6, 8, 10, 12]

    svc = TrendIdentificationService()
    out = await svc.identify_trend(PredictionInput(payload={"x": x, "y": y}))

    data = out["data"]
    assert isinstance(data["correlation"], float)
    assert isinstance(data["regression_slope"], float)
    assert isinstance(data["p_value"], float)
    assert isinstance(data["trend_classification"], str)

    # With a deterministic linear relationship, correlation should be positive and reasonably large.
    assert data["correlation"] > 0

