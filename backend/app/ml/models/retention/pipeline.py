from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
from joblib import dump, load
from sklearn.ensemble import RandomForestRegressor


@dataclass(frozen=True)
class RetentionRFConfig:
    n_estimators: int = 400
    random_state: int = 42


class RetentionPredictionPipeline:
    """RandomForest regressor for teacher retention metrics.

    This pipeline expects a fully numeric feature matrix (after preprocessing).
    """

    def __init__(self, cfg: RetentionRFConfig | None = None):
        self.cfg = cfg or RetentionRFConfig()
        self.model: RandomForestRegressor | None = None
        self.feature_columns: list[str] | None = None

    def fit(self, X: np.ndarray, y: np.ndarray, feature_columns: list[str]) -> "RetentionPredictionPipeline":
        self.feature_columns = list(feature_columns)
        self.model = RandomForestRegressor(
            n_estimators=self.cfg.n_estimators,
            random_state=self.cfg.random_state,
            n_jobs=-1,
        )
        self.model.fit(X, y)
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        if self.model is None:
            raise RuntimeError("Retention pipeline not fitted")
        return self.model.predict(X)

    def save(self, path: str | Path) -> None:
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        dump(
            {
                "cfg": self.cfg,
                "model": self.model,
                "feature_columns": self.feature_columns,
            },
            path,
        )

    @classmethod
    def load(cls, path: str | Path) -> "RetentionPredictionPipeline":
        payload = load(path)
        obj = cls(cfg=payload.get("cfg"))
        obj.model = payload["model"]
        obj.feature_columns = payload.get("feature_columns")
        return obj

