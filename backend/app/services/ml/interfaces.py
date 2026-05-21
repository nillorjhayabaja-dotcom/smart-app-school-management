from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class PredictionInput:
    # Generic container for future real feature sets
    payload: dict


class ForecastingService:
    async def forecast(self, inp: PredictionInput) -> dict:  # JSON serializable
        raise NotImplementedError


class RetentionPredictionService:
    async def predict_retention(self, inp: PredictionInput) -> dict:
        raise NotImplementedError


class EnrollmentForecastingService(ForecastingService):
    """Alias for semantic clarity; kept for future expansion."""






class RiskAnalysisService:
    async def analyze_risk(self, inp: PredictionInput) -> dict:
        raise NotImplementedError


class RecommendationService:
    async def recommend(self, inp: PredictionInput) -> dict:
        raise NotImplementedError

