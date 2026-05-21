from __future__ import annotations

from typing import Any

import numpy as np

from app.ml.models.retention.metrics import (
    derive_hiring_requirement,
    derive_resignation_from_retention,
)
from app.ml.models.retention.pipeline import RetentionPredictionPipeline
from app.ml.preprocessing import PreprocessorConfig, basic_preprocess
from app.ml.utils.json_serializable import to_jsonable
from app.services.ml.interfaces import PredictionInput, RetentionPredictionService


class TeacherRetentionPredictionService(RetentionPredictionService):
    """RandomForest-based retention prediction.

    Expected payload shape (minimal):
    {
      "history": [
         {"salary_ratio":..., "workload_per_teacher":..., "training_hours":...,
          "satisfaction":..., "student_teacher_ratio":..., "retention":...,
          "resigned":... (optional), ...}
      ],
      "future_features": [
         {"salary_ratio":..., "workload_per_teacher":..., "training_hours":...,
          "satisfaction":..., "student_teacher_ratio":...}
      ],
      "current_teachers": 50,
      "target_teacher_count": 55
    }

    If history is missing, returns placeholder predictions.
    """

    async def predict_retention(self, inp: PredictionInput) -> dict:
        payload: dict[str, Any] = inp.payload or {}
        history = payload.get("history") or []
        future_features = payload.get("future_features") or []

        current_teachers = int(payload.get("current_teachers", 0))
        target_teacher_count = int(payload.get("target_teacher_count", 0))

        if not history or not future_features:
            return {
                "retention": {"value": 0.0},
                "resignation": {"probability": 1.0},
                "hiring": {"required": 0},
                "meta": {"model": "stub_empty_input"},
            }

        # Use pandas-based preprocess via basic_preprocess on DataFrames.
        import pandas as pd

        df_train = pd.DataFrame(history)

        df_future = pd.DataFrame(future_features)

        # Determine target: prefer 'retention' column.
        target_col = "retention" if "retention" in df_train.columns else None
        if not target_col:
            raise ValueError("history must include 'retention' column")

        pre_cfg = PreprocessorConfig(target_col=target_col)
        X_train, y_train, feature_cols = basic_preprocess(df_train, config=pre_cfg)

        # Align future to training columns using dummies inside preprocessing
        X_future_df = df_future.copy()
        # Ensure we include missing feature cols later by preprocessing
        X_future, _, _ = basic_preprocess(
            X_future_df.assign(**{target_col: df_train[target_col].mean()}),
            config=pre_cfg,
        )

        # Basic safeguard: if feature spaces mismatch, just reuse RF trained on training feature space
        # by trimming/padding.
        if X_future.shape[1] != X_train.shape[1]:
            # pad/trim
            if X_future.shape[1] > X_train.shape[1]:
                X_future = X_future[:, : X_train.shape[1]]
            else:
                pad = X_train.shape[1] - X_future.shape[1]
                X_future = np.pad(X_future, ((0, 0), (0, pad)))

        rf = RetentionPredictionPipeline()
        rf.fit(X_train, y_train, feature_cols)
        retention_pred = float(np.mean(rf.predict(X_future)))

        resignation_prob = derive_resignation_from_retention(retention_pred)
        hiring_required = derive_hiring_requirement(
            resignation_probability=resignation_prob,
            current_teachers=current_teachers,
            target_teacher_count=target_teacher_count,
        )

        return {
            "retention": {"value": retention_pred},
            "resignation": {"probability": resignation_prob},
            "hiring": {"required": hiring_required},
            "meta": to_jsonable({"model": "random_forest_retention", "target": target_col}),
        }


class RetentionAnalyticsService(TeacherRetentionPredictionService):
    pass

