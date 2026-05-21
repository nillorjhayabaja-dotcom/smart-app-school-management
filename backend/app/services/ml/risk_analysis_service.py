from __future__ import annotations

from app.services.ml.interfaces import RiskAnalysisService, PredictionInput


class DefaultRiskAnalysisService(RiskAnalysisService):
    async def analyze_risk(self, inp: PredictionInput) -> dict:
        # Stub output retained for now; next step will replace with weighted risk + explanations.
        return {
            "data": [
                {"department": "Mathematics", "low": 4, "medium": 2, "high": 3},
                {"department": "Science", "low": 6, "medium": 1, "high": 2},
                {"department": "English", "low": 7, "medium": 2, "high": 0},
            ]
        }



