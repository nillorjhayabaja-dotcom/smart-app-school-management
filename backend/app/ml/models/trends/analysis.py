from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
from scipy import stats
from sklearn.linear_model import LinearRegression


@dataclass(frozen=True)
class TrendAnalysisResult:
    correlation: float
    regression_slope: float
    p_value: float
    classification: str


def analyze_class_size_vs_performance(x: np.ndarray, y: np.ndarray) -> TrendAnalysisResult:
    x = np.asarray(x, dtype=float).reshape(-1)
    y = np.asarray(y, dtype=float).reshape(-1)
    if len(x) != len(y) or len(x) < 3:
        raise ValueError("x and y must be same length and >= 3")

    corr = stats.pearsonr(x, y)
    corr_coef = float(corr.statistic)
    p_val = float(corr.pvalue)

    lr = LinearRegression().fit(x.reshape(-1, 1), y)
    slope = float(lr.coef_[0])

    # Simple classification heuristic
    abs_corr = abs(corr_coef)
    if p_val < 0.05:
        strength = "strong" if abs_corr >= 0.7 else "moderate" if abs_corr >= 0.4 else "weak"
        direction = "positive" if corr_coef >= 0 else "negative"
        cls = f"{direction}_{strength}"
    else:
        cls = "no_significant_trend"

    return TrendAnalysisResult(
        correlation=corr_coef,
        regression_slope=slope,
        p_value=p_val,
        classification=cls,
    )

