# Machine Learning Modules — WorkforceIQ EDU

## Overview

WorkforceIQ EDU integrates machine learning capabilities to provide predictive analytics for educational workforce management. The ML layer uses **ARIMA** for time-series forecasting, **Random Forest** for regression prediction, and custom scoring algorithms for risk assessment.

---

## ML Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      ML SERVICE LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Service Interfaces                       │  │
│  │  ForecastingService │ RetentionService │ RiskService       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Service Implementations                  │  │
│  │  StudentEnrollment │ TeacherRetention │ RiskScoring       │  │
│  │  Forecasting       │ Prediction       │ Analysis          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   ML Models                                │  │
│  │  ARIMA(1,1,1)     │ RandomForest     │ Composite         │  │
│  │  (statsmodels)     │ (scikit-learn)   │ Scoring           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Utilities                                │  │
│  │  Feature Engineering │ Preprocessing │ JSON Serialization │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Module 1: Enrollment Forecasting (ARIMA)

### Purpose

Predict student enrollment 1-3 years ahead using ARIMA (AutoRegressive Integrated Moving Average) time-series models with confidence intervals.

### Model Configuration

```python
@dataclass(frozen=True)
class ArimaConfig:
    order: tuple[int, int, int] = (1, 1, 1)  # (p, d, q)
    alpha: float = 0.05  # 95% confidence intervals
```

### Input Data

```json
{
  "historical_enrollment": [1200, 1250, 1300, 1280, 1350, 1400, 1380, 1420, 1450, 1500],
  "forecast_years": 3
}
```

### Processing Pipeline

```
1. Data Validation
   └── Ensure minimum 5 data points
   └── Convert to numpy float array

2. Model Fitting
   └── ARIMA(1, 1, 1) on historical data
   └── Maximum likelihood estimation
   └── Residual diagnostics

3. Forecasting
   └── Generate point forecasts
   └── Calculate confidence intervals (95%)
   └── Return forecast + bounds

4. Response Formatting
   └── JSON serialization of numpy arrays
   └── Include model metadata
```

### Output

```json
{
  "data": {
    "forecast": [1530, 1565, 1600],
    "confidence_lower": [1480, 1460, 1420],
    "confidence_upper": [1580, 1670, 1780]
  },
  "meta": {
    "model": "ARIMA(1,1,1)",
    "alpha": 0.05,
    "data_points": 10,
    "forecast_years": 3
  }
}
```

### ARIMA Implementation

```python
class ArimaForecaster:
    def __init__(self, cfg: ArimaConfig | None = None):
        self.cfg = cfg or ArimaConfig()
        self.model_: ARIMA | None = None
        self.res_ = None

    def fit(self, y: np.ndarray) -> "ArimaForecaster":
        y = np.asarray(y, dtype=float)
        self.model_ = ARIMA(y, order=self.cfg.order)
        self.res_ = self.model_.fit()
        return self

    def forecast(self, steps: int) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        fc = np.asarray(self.res_.forecast(steps=steps), dtype=float)
        ci = self.res_.get_forecast(steps=steps).conf_int(alpha=self.cfg.alpha)
        ci_low = np.asarray(ci.iloc[:, 0], dtype=float)
        ci_high = np.asarray(ci.iloc[:, 1], dtype=float)
        return fc, ci_low, ci_high
```

### Business Value

- **Proactive Staffing** — Hire teachers before enrollment surge
- **Budget Planning** — Allocate resources based on projections
- **Capacity Management** — Identify facility needs early

---

## Module 2: Teacher Retention Prediction (Random Forest)

### Purpose

Predict teacher retention probability and identify at-risk staff before they leave using Random Forest regression.

### Model Configuration

```python
@dataclass(frozen=True)
class RetentionRFConfig:
    n_estimators: int = 400  # Number of trees
    random_state: int = 42   # Reproducibility
```

### Input Features

| Feature | Type | Description |
|---------|------|-------------|
| `workload` | int | Current workload percentage (0-100) |
| `performance` | int | Performance rating (0-100) |
| `tenure_years` | float | Years of employment |
| `department` | string | Department assignment |
| `employment_type` | string | Full-time, part-time, contract |
| `salary` | float | Annual salary |

### Processing Pipeline

```
1. Feature Engineering
   └── Encode categorical variables
   └── Normalize numeric features
   └── Handle missing values

2. Model Training
   └── RandomForestRegressor(n_estimators=400)
   └── Fit on historical employee data
   └── Extract feature importances

3. Prediction
   └── Generate retention probability (0-100%)
   └── Classify risk level (low/medium/high)
   └── Calculate confidence score

4. Response Formatting
   └── Return predictions with metadata
```

### Output

```json
{
  "data": {
    "predictions": [
      {
        "retention_probability": 0.87,
        "risk_level": "low",
        "confidence": 0.92
      }
    ]
  },
  "meta": {
    "model": "RandomForestRegressor",
    "n_estimators": 400,
    "feature_importances": {
      "workload": 0.35,
      "performance": 0.28,
      "tenure_years": 0.22,
      "salary": 0.15
    }
  }
}
```

### Implementation

```python
class RetentionPredictionPipeline:
    def __init__(self, cfg: RetentionRFConfig | None = None):
        self.cfg = cfg or RetentionRFConfig()
        self.model: RandomForestRegressor | None = None
        self.feature_columns: list[str] | None = None

    def fit(self, X: np.ndarray, y: np.ndarray, feature_columns: list[str]):
        self.feature_columns = list(feature_columns)
        self.model = RandomForestRegressor(
            n_estimators=self.cfg.n_estimators,
            random_state=self.cfg.random_state,
            n_jobs=-1,  # Use all CPU cores
        )
        self.model.fit(X, y)
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict(X)

    def save(self, path: str | Path) -> None:
        dump({"cfg": self.cfg, "model": self.model,
              "feature_columns": self.feature_columns}, path)

    @classmethod
    def load(cls, path: str | Path) -> "RetentionPredictionPipeline":
        payload = load(path)
        obj = cls(cfg=payload.get("cfg"))
        obj.model = payload["model"]
        obj.feature_columns = payload.get("feature_columns")
        return obj
```

### Business Value

- **Early Intervention** — Identify at-risk teachers before resignation
- **Retention Programs** — Target support to high-risk individuals
- **Cost Savings** — Reduce turnover costs (recruitment, training)

---

## Module 3: Risk Assessment (Multi-Factor Scoring)

### Purpose

Evaluate workforce risk across departments using composite scoring algorithms.

### Risk Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Workload Imbalance | 25% | Teachers over/under 80% utilization |
| Performance Decline | 20% | Below 60% performance rating |
| Retention Risk | 25% | High-risk employees per department |
| Staffing Gaps | 15% | Unfilled positions |
| Tenure Distribution | 15% | Experience concentration risk |

### Output

```json
[
  {
    "department": "Mathematics",
    "low": 8,
    "medium": 3,
    "high": 1
  },
  {
    "department": "Science",
    "low": 6,
    "medium": 4,
    "high": 2
  }
]
```

### Risk Classification

| Risk Level | Score Range | Action Required |
|-----------|-------------|-----------------|
| Low | 0-30 | Monitor quarterly |
| Medium | 31-70 | Review monthly |
| High | 71-100 | Immediate attention |

---

## Module 4: Recommendation Engine

### Purpose

Generate actionable workforce optimization suggestions ranked by impact and confidence.

### Recommendation Categories

| Category | Description | Example |
|----------|-------------|---------|
| `allocation` | Staffing optimization | "Hire 2 Science teachers" |
| `training` | Professional development | "Provide leadership training" |
| `retention` | Retention strategies | "Adjust workload for Dept X" |
| `scheduling` | Schedule optimization | "Reduce class sizes in Math" |

### Ranking Algorithm

```python
def rank_recommendations(recommendations: list) -> list:
    """
    Rank recommendations by composite score.
    Score = (impact_weight × impact_score) + (confidence × 0.3)
    """
    impact_weights = {"high": 1.0, "medium": 0.6, "low": 0.3}
    
    for rec in recommendations:
        rec.score = (
            impact_weights[rec.impact] * 0.7 +
            rec.confidence * 0.3
        )
    
    return sorted(recommendations, key=lambda r: r.score, reverse=True)
```

### Output

```json
[
  {
    "id": "rec-uuid",
    "title": "Hire 2 additional Science teachers by next semester",
    "category": "allocation",
    "impact": "high",
    "confidence": 0.89,
    "description": "Science department is approaching critical staffing levels with 3 teachers handling 45 sections.",
    "action_items": [
      "Post job listings for 2 Science teachers",
      "Schedule interviews within 2 weeks",
      "Prepare onboarding materials"
    ]
  }
]
```

---

## Async ML Inference

### Thread Pool Execution

All ML operations run in a thread pool to keep the FastAPI event loop responsive:

```python
class AsyncModelMixin:
    """Run CPU-bound training/prediction in a thread."""
    
    async def run_in_thread(self, fn, *args, **kwargs):
        return await asyncio.to_thread(fn, *args, **kwargs)

# Usage in service
class StudentEnrollmentForecastingService(AsyncModelMixin):
    async def forecast(self, inp: PredictionInput) -> dict:
        return await self.run_in_thread(self._sync_forecast, inp)
    
    def _sync_forecast(self, inp: PredictionInput) -> dict:
        forecaster = ArimaForecaster()
        forecaster.fit(y_data)
        forecast, lower, upper = forecaster.forecast(steps=3)
        return {"data": {...}, "meta": {...}}
```

### Performance Characteristics

| Operation | Latency | CPU Usage |
|-----------|---------|-----------|
| ARIMA Fit (10 points) | ~50ms | Single core |
| ARIMA Forecast (3 steps) | ~10ms | Single core |
| Random Forest Fit | ~200ms | All cores (n_jobs=-1) |
| Random Forest Predict | ~5ms | Single core |
| Feature Engineering | ~20ms | Single core |

---

## Model Persistence

### Save/Load Pattern

```python
# Save model
pipeline.save("models/retention_v1.joblib")

# Load model
pipeline = RetentionPredictionPipeline.load("models/retention_v1.joblib")
```

### Model Versioning

```
models/
├── enrollment/
│   ├── arima_v1.joblib
│   └── arima_v2.joblib
├── retention/
│   ├── rf_v1.joblib
│   └── rf_v2.joblib
└── risk/
    └── scoring_config.json
```

---

## Feature Engineering

### Numerical Features

```python
# Workload normalization
workload_normalized = workload / 100.0  # Scale to 0-1

# Tenure calculation
tenure_years = (current_date - hire_date).days / 365.25

# Performance ratio
performance_ratio = performance / 100.0
```

### Categorical Encoding

```python
# Department one-hot encoding
department_encoded = pd.get_dummies(departments, prefix="dept")

# Employment type mapping
employment_type_map = {
    "full_time": 1.0,
    "part_time": 0.5,
    "contract": 0.3
}
```

### Missing Value Handling

```python
# Numeric: median imputation
df[numerical_cols] = df[numerical_cols].fillna(df[numerical_cols].median())

# Categorical: mode imputation
df[categorical_cols] = df[categorical_cols].fillna(df[categorical_cols].mode())
```

---

## API Integration

### Endpoint Mapping

| Endpoint | Service | Model |
|----------|---------|-------|
| `POST /analytics/enrollment` | `StudentEnrollmentForecastingService` | ARIMA |
| `POST /analytics/retention` | `TeacherRetentionPredictionService` | RandomForest |
| `POST /analytics/trend` | `TrendIdentificationService` | Linear Regression |
| `GET /risk` | `RiskScoringService` | Composite Algorithm |
| `GET /recommendations` | `RecommendationService` | Rule-based + ML |

### Error Handling

```python
try:
    result = await service.forecast(inp)
except ValueError as e:
    raise HTTPException(400, detail=f"Invalid input: {e}")
except RuntimeError as e:
    raise HTTPException(500, detail=f"Model error: {e}")
```

---

## Model Evaluation

### ARIMA Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| MAPE | < 5% | Mean Absolute Percentage Error |
| RMSE | < 50 | Root Mean Squared Error |
| R² | > 0.90 | Coefficient of Determination |

### Random Forest Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| MAE | < 5 | Mean Absolute Error |
| R² | > 0.85 | Coefficient of Determination |
| Feature Importance | Stable | Consistent across runs |

---

## Future Enhancements

### Short-term (3-6 months)

- **Model Retraining Pipeline** — Automated retraining on new data
- **A/B Testing Framework** — Compare model versions
- **Feature Store** — Centralized feature management

### Medium-term (6-12 months)

- **Deep Learning** — LSTM for enrollment forecasting
- **Ensemble Models** — Combine ARIMA + Random Forest
- **Real-time Predictions** — WebSocket-based live updates

### Long-term (12+ months)

- **AutoML** — Automated model selection
- **Explainable AI** — SHAP values for prediction解释ability
- **Transfer Learning** — Cross-institution model adaptation