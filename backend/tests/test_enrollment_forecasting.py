import numpy as np
import pandas as pd
import pytest
import tempfile
from pathlib import Path


from app.ml.preprocessing import PreprocessorConfig, basic_preprocess
from app.ml.models.enrollment.pipeline import EnrollmentForecastPipeline
from app.services.ml.forecasting_service import StudentEnrollmentForecastingService
from app.services.ml.interfaces import PredictionInput


def test_basic_preprocess_imputes_and_one_hot():
    df = pd.DataFrame(
        [
            {"month": "2025-01", "enrollment": 100, "strand": "ABM", "x": 1.0},
            {"month": "2025-02", "enrollment": 110, "strand": "TVL", "x": None},
        ]
    )
    cfg = PreprocessorConfig(target_col="enrollment", date_col="month")
    X, y, feature_cols = basic_preprocess(df, config=cfg)

    assert X.shape[0] == 2
    assert y.shape[0] == 2
    assert len(feature_cols) == X.shape[1]
    # one-hot encoded strand should produce some non-empty feature columns
    assert any("strand" in c for c in feature_cols)
    assert np.isfinite(X).all()


def test_basic_preprocess_handles_all_missing_numeric():
    """Test that numeric columns with all NaN are filled with median (0 when all missing)."""
    df = pd.DataFrame({
        "enrollment": [100, 110, 120],
        "all_nan": [None, None, None],
    })
    cfg = PreprocessorConfig(target_col="enrollment")
    X, y, feature_cols = basic_preprocess(df, config=cfg)
    
    assert X.shape == (3, 1)
    assert "all_nan" in feature_cols
    assert np.isfinite(X).all()


def test_basic_preprocess_handles_categorical_missing():
    """Test that categorical columns with missing values are filled with __missing__."""
    df = pd.DataFrame({
        "enrollment": [100, 110, 120],
        "category": ["A", None, "B"],
    })
    cfg = PreprocessorConfig(target_col="enrollment")
    X, y, feature_cols = basic_preprocess(df, config=cfg)
    
    # Should have one-hot encoded categories
    assert X.shape[0] == 3
    assert np.isfinite(X).all()
    # Check that __missing__ category was created
    assert any("__missing__" in c for c in feature_cols)


def test_enrollment_pipeline_fit_predict_length_and_residual_std():
    # numeric-only features
    X = np.array([[1.0, 0.0], [2.0, 1.0], [3.0, 1.0], [4.0, 0.0]], dtype=float)
    y = np.array([10.0, 12.0, 15.0, 18.0], dtype=float)
    feature_cols = ["f1", "f2"]

    pipe = EnrollmentForecastPipeline()
    pipe.fit(X, y, feature_cols)

    assert pipe.model is not None
    assert isinstance(pipe.residual_std_, float)
    assert pipe.residual_std_ > 0

    preds = pipe.predict(X)
    assert preds.shape == (4,)


def test_enrollment_pipeline_predict_before_fit_raises():
    """Test that predicting before fitting raises RuntimeError."""
    pipe = EnrollmentForecastPipeline()
    X = np.array([[1.0, 0.0]])
    
    with pytest.raises(RuntimeError, match="not fitted"):
        pipe.predict(X)


def test_enrollment_pipeline_save_load():
    """Test that pipeline can be saved and loaded correctly."""
    X = np.array([[1.0, 0.0], [2.0, 1.0], [3.0, 1.0], [4.0, 0.0]], dtype=float)
    y = np.array([10.0, 12.0, 15.0, 18.0], dtype=float)
    feature_cols = ["f1", "f2"]
    
    pipe = EnrollmentForecastPipeline()
    pipe.fit(X, y, feature_cols)
    original_pred = pipe.predict(X)
    
    with tempfile.TemporaryDirectory() as tmpdir:
        model_path = Path(tmpdir) / "model.joblib"
        pipe.save(model_path)
        
        # Load and verify predictions match
        loaded_pipe = EnrollmentForecastPipeline.load(model_path)
        loaded_pred = loaded_pipe.predict(X)
        
        assert np.allclose(original_pred, loaded_pred)
        assert loaded_pipe.feature_columns == feature_cols
        assert loaded_pipe.residual_std_ > 0


def test_enrollment_pipeline_feature_columns_preserved():
    """Test that feature columns are preserved after fit."""
    X = np.random.randn(10, 3)
    y = np.random.randn(10)
    feature_cols = ["feat_a", "feat_b", "feat_c"]
    
    pipe = EnrollmentForecastPipeline()
    pipe.fit(X, y, feature_cols)
    
    assert pipe.feature_columns == feature_cols


@pytest.mark.asyncio
async def test_student_enrollment_forecast_contract_empty_input():
    svc = StudentEnrollmentForecastingService()
    out = await svc.forecast(PredictionInput(payload={}))

    assert "data" in out
    assert "meta" in out
    assert isinstance(out["data"], list)
    assert len(out["data"]) == 3  # default horizon in service is 3

    for item in out["data"]:
        assert set(item.keys()) == {"month", "actual", "forecast", "conf_int"}
        assert item["actual"] is None
        assert isinstance(item["forecast"], float)
        assert isinstance(item["conf_int"], list)
        assert len(item["conf_int"]) == 2


@pytest.mark.asyncio
async def test_student_enrollment_forecast_contract_with_arima_only():
    svc = StudentEnrollmentForecastingService()

    payload = {
        "horizon": 4,
        "enrollment": [
            {"month": "2025-01", "enrollment": 100},
            {"month": "2025-02", "enrollment": 105},
            {"month": "2025-03", "enrollment": 110},
            {"month": "2025-04", "enrollment": 120},
            {"month": "2025-05", "enrollment": 130},
        ],
        # Intentionally omit students/teachers so RF path is skipped.
    }

    out = await svc.forecast(PredictionInput(payload=payload))

    assert len(out["data"]) == 4
    for item in out["data"]:
        assert "month" in item
        assert "forecast" in item
        assert "conf_int" in item


@pytest.mark.asyncio
async def test_student_enrollment_forecast_contract_with_horizon():
    """Test that custom horizon is respected."""
    svc = StudentEnrollmentForecastingService()

    payload = {
        "horizon": 6,
        "enrollment": [
            {"month": "2025-01", "enrollment": 100},
            {"month": "2025-02", "enrollment": 105},
            {"month": "2025-03", "enrollment": 110},
        ],
    }

    out = await svc.forecast(PredictionInput(payload=payload))

    assert len(out["data"]) == 6
    assert "meta" in out
    assert isinstance(out["meta"], dict)


@pytest.mark.asyncio
async def test_student_enrollment_forecast_confidence_intervals_valid():
    """Test that confidence intervals are properly ordered (lower < upper)."""
    svc = StudentEnrollmentForecastingService()

    payload = {
        "horizon": 3,
        "enrollment": [
            {"month": "2025-01", "enrollment": 100},
            {"month": "2025-02", "enrollment": 110},
            {"month": "2025-03", "enrollment": 120},
        ],
    }

    out = await svc.forecast(PredictionInput(payload=payload))

    for item in out["data"]:
        lower, upper = item["conf_int"]
        assert lower <= upper
        assert isinstance(lower, (int, float))
        assert isinstance(upper, (int, float))
