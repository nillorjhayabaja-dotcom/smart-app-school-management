from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd


@dataclass(frozen=True)
class EnrollmentForecastConfig:
    horizon: int = 6


def compute_confidence_interval(point_forecast: np.ndarray, *, residual_std: float, z: float = 1.96) -> tuple[np.ndarray, np.ndarray]:
    """Simple Gaussian CI using residual std from training residuals."""
    point_forecast = point_forecast.astype(float)
    half = z * float(residual_std)
    lower = point_forecast - half
    upper = point_forecast + half
    return lower, upper


def month_index_to_str(i: int) -> str:
    # helper for UI; caller can override
    return f"t+{i}"

