from __future__ import annotations

from typing import Any

import numpy as np

from app.ml.models.trends.analysis import analyze_class_size_vs_performance
from app.ml.utils.json_serializable import to_jsonable
from app.services.ml.interfaces import PredictionInput


class TrendIdentificationService:
    """Module 3: Trend identification.

    Payload expected:
    {
      "x": [ ... ],  # class_size or enrollment/workload
      "y": [ ... ],  # teacher performance or workload
      "metric": "class_size_vs_performance" (optional)
    }
    """

    async def identify_trend(self, inp: PredictionInput) -> dict:
        payload: dict[str, Any] = inp.payload or {}
        x = payload.get("x")
        y = payload.get("y")
        if x is None or y is None:
            return {
                "data": {
                    "correlation": 0.0,
                    "regression_slope": 0.0,
                    "p_value": 1.0,
                    "trend_classification": "insufficient_data",
                },
                "meta": {"model": "trend_stub"},
            }

        res = analyze_class_size_vs_performance(np.asarray(x), np.asarray(y))
        return {
            "data": {
                "correlation": res.correlation,
                "regression_slope": res.regression_slope,
                "p_value": res.p_value,
                "trend_classification": res.classification,
            },
            "meta": to_jsonable({"model": "pearson+linreg"}),
        }

