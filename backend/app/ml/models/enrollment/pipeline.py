from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from joblib import dump, load
from sklearn.ensemble import RandomForestRegressor


@dataclass(frozen=True)
class EnrollmentRFConfig:
    n_estimators: int = 300
    random_state: int = 42


class EnrollmentForecastPipeline:
    """RandomForest-based forecasting surrogate.

    Note: ARIMA is handled separately in the service; RF is used for feature-rich modeling.
    """

    def __init__(self, cfg: EnrollmentRFConfig | None = None):
        self.cfg = cfg or EnrollmentRFConfig()
        self.model: RandomForestRegressor | None = None
        self.feature_columns: list[str] | None = None
        self.residual_std_: float = 1.0

    def fit(self, X: np.ndarray, y: np.ndarray, feature_columns: list[str]) -> "EnrollmentForecastPipeline":
        self.feature_columns = list(feature_columns)
        self.model = RandomForestRegressor(
            n_estimators=self.cfg.n_estimators,
            random_state=self.cfg.random_state,
            n_jobs=-1,
        )
        self.model.fit(X, y)
        preds = self.model.predict(X)
        resid = y - preds
        self.residual_std_ = float(np.std(resid)) if np.std(resid) > 0 else 1.0
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        if self.model is None:
            raise RuntimeError("Pipeline not fitted")
        return self.model.predict(X)

    def save(self, path: str | Path) -> None:
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "cfg": self.cfg,
            "model": self.model,
            "feature_columns": self.feature_columns,
            "residual_std_": self.residual_std_,
        }
        dump(payload, path)

    @classmethod
    def load(cls, path: str | Path) -> "EnrollmentForecastPipeline":
        payload = load(path)
        obj = cls(cfg=payload.get("cfg"))
        obj.model = payload["model"]
        obj.feature_columns = payload["feature_columns"]
        obj.residual_std_ = float(payload.get("residual_std_", 1.0))
        return obj

