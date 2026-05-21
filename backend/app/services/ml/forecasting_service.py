from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA

from app.ml.feature_engineering import add_student_teacher_ratio
from app.ml.models.enrollment.pipeline import EnrollmentForecastPipeline
from app.ml.preprocessing import PreprocessorConfig, basic_preprocess
from app.ml.utils.json_serializable import to_jsonable
from app.ml.config import MODEL_PATHS
from app.services.ml.interfaces import ForecastingService, PredictionInput



class StudentEnrollmentForecastingService(ForecastingService):
    """Enrollment forecasting with:

    Production hardening additions:
    - optional RF model persistence via joblib under MODEL_PATHS.forecasting()

    - ARIMA on historical enrollment
    - RandomForest regression on engineered features

    Input payload (expected shape):
    {
      "enrollment": [{"month":"2025-01", "enrollment":120}, ...],
      "students":  [{"month":"2025-01","strand":"ABM","students": ...}, ...] (optional)
      "teachers":  [{"month":"2025-01","strand":"ABM","teachers": ...}, ...] (optional)
      "student_teacher_ratios": [{"month":"2025-01","strand":"ABM","students":...,"teachers":...}] (optional)
      "strand": "ABM" (optional)
      "horizon": 6 (optional)
    }

    If strand-specific features are missing, falls back to enrollment-only modeling.
    """

    async def forecast(self, inp: PredictionInput) -> dict:
        payload: dict[str, Any] = inp.payload or {}
        horizon: int = int(payload.get("horizon", 3))

        enrollment_rows = payload.get("enrollment") or []
        if not enrollment_rows:
            # Preserve UI contract even when no data provided.
            return {
                "data": [
                    {"month": "t+1", "actual": None, "forecast": 0.0, "conf_int": [0.0, 0.0]},
                    {"month": "t+2", "actual": None, "forecast": 0.0, "conf_int": [0.0, 0.0]},
                    {"month": "t+3", "actual": None, "forecast": 0.0, "conf_int": [0.0, 0.0]},
                ][:horizon],
                "meta": {"model": "stub_empty_input"},
            }

        df_enr = pd.DataFrame(enrollment_rows)
        if "month" not in df_enr.columns or "enrollment" not in df_enr.columns:
            raise ValueError("enrollment must include 'month' and 'enrollment' fields")

        df_enr = df_enr.sort_values("month")
        y = df_enr["enrollment"].astype(float).to_numpy()

        # --- ARIMA forecast ---
        # Simple order selection; production would tune via CV.
        arima = ARIMA(y, order=(1, 1, 1))
        arima_res = arima.fit()
        arima_fc = arima_res.forecast(steps=horizon)
        arima_ci = arima_res.get_forecast(steps=horizon).conf_int(alpha=0.05)

        # statsmodels may return either a DataFrame or ndarray depending on version/fit.
        # Normalize to numpy arrays with shape: (steps, 2) => low/high.
        if hasattr(arima_ci, "iloc"):
            arima_ci_low = arima_ci.iloc[:, 0]
            arima_ci_high = arima_ci.iloc[:, 1]
        else:
            arima_ci_arr = np.asarray(arima_ci, dtype=float)
            arima_ci_low = arima_ci_arr[:, 0]
            arima_ci_high = arima_ci_arr[:, 1]


        # --- RF feature model (optional) ---
        strand = payload.get("strand")
        students_rows = payload.get("students") or []
        teachers_rows = payload.get("teachers") or []

        rf_forecast: np.ndarray | None = None
        rf_ci: tuple[np.ndarray, np.ndarray] | None = None

        if students_rows and teachers_rows and strand:
            df_s = pd.DataFrame(students_rows)
            df_t = pd.DataFrame(teachers_rows)
            if {"month", "strand", "students"}.issubset(df_s.columns) and {"month", "strand", "teachers"}.issubset(
                df_t.columns
            ):
                df_s = df_s[df_s["strand"] == strand]
                df_t = df_t[df_t["strand"] == strand]
                df_feat = pd.merge(df_s[["month", "students"]], df_t[["month", "teachers"]], on="month", how="inner")
                if len(df_feat) >= 3:
                    df_feat = add_student_teacher_ratio(df_feat, students_col="students", teachers_col="teachers")
                    # training target: enrollment; if enrollment exists for same months, align.
                    df_feat = pd.merge(df_feat, df_enr[["month", "enrollment"]], on="month", how="inner")
                    if len(df_feat) >= 3:
                        pre_cfg = PreprocessorConfig(target_col="enrollment")
                        X, y_train, feature_cols = basic_preprocess(df_feat, config=pre_cfg)
                        rf = EnrollmentForecastPipeline()
                        rf.fit(X, y_train, feature_cols)

                        # Persist the fitted RF model for later reuse.
                        # Filename includes strand to avoid collisions.
                        model_dir = MODEL_PATHS.forecasting()
                        model_path = model_dir / f"enrollment_rf_{strand}.joblib"
                        rf.save(model_path)
                        rf_forecast = rf.predict(X[-horizon:] if len(X) >= horizon else X)
                        # For CI use training residual std
                        half = 1.96 * rf.residual_std_
                        rf_ci = (rf_forecast - half, rf_forecast + half)

        # --- Combine forecasts (simple average) ---
        arima_fc = np.asarray(arima_fc, dtype=float)
        point = arima_fc
        ci_low = np.asarray(arima_ci_low, dtype=float)
        ci_high = np.asarray(arima_ci_high, dtype=float)


        if rf_forecast is not None:
            # ensure correct length
            rf_forecast = np.asarray(rf_forecast, dtype=float)
            if len(rf_forecast) >= horizon:
                rf_forecast = rf_forecast[-horizon:]
            else:
                rf_forecast = np.pad(rf_forecast, (horizon - len(rf_forecast), 0), constant_values=float(rf_forecast[0]))

            point = 0.5 * arima_fc + 0.5 * rf_forecast

            if rf_ci is not None:
                rf_low, rf_high = rf_ci
                rf_low = np.asarray(rf_low, dtype=float)
                rf_high = np.asarray(rf_high, dtype=float)
                if len(rf_low) >= horizon:
                    rf_low = rf_low[-horizon:]
                    rf_high = rf_high[-horizon:]
                half_low = 0.5 * ci_low + 0.5 * rf_low
                half_high = 0.5 * ci_high + 0.5 * rf_high
                ci_low, ci_high = half_low, half_high

        # --- Prepare chart-ready output ---
        # month labels: if we have enough historical months, extend; else t+K
        months = df_enr["month"].tolist()
        last = months[-1]
        # naive monthly increment for ISO-like YYYY-MM
        def next_month_str(m: str, k: int) -> str:
            try:
                dt = pd.to_datetime(m)
                dt2 = dt + pd.DateOffset(months=k)
                return dt2.strftime("%Y-%m")
            except Exception:
                return f"t+{k}"

        out = []
        for k in range(1, horizon + 1):
            month_label = next_month_str(str(last), k)
            out.append(
                {
                    "month": month_label,
                    "actual": None,
                    "forecast": float(point[k - 1]),
                    "conf_int": [float(ci_low[k - 1]), float(ci_high[k - 1])],
                }
            )

        return {
            "data": out,
            "meta": to_jsonable({"model": "arima+rf_optional", "horizon": horizon}),
        }


class EnrollmentAnalyticsForecastingService(ForecastingService):
    async def forecast(self, inp: PredictionInput) -> dict:
        return await StudentEnrollmentForecastingService().forecast(inp)


