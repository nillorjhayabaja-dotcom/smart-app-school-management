from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from statsmodels.tsa.arima.model import ARIMA


@dataclass(frozen=True)
class ArimaConfig:
    order: tuple[int, int, int] = (1, 1, 1)
    alpha: float = 0.05


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
        if self.res_ is None:
            raise RuntimeError("ArimaForecaster not fitted")
        fc = np.asarray(self.res_.forecast(steps=steps), dtype=float)
        ci = self.res_.get_forecast(steps=steps).conf_int(alpha=self.cfg.alpha)
        ci_low = np.asarray(ci.iloc[:, 0], dtype=float)
        ci_high = np.asarray(ci.iloc[:, 1], dtype=float)
        return fc, ci_low, ci_high

