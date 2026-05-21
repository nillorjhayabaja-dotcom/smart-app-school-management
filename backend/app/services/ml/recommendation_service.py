from __future__ import annotations

from app.services.ml.interfaces import RecommendationService, PredictionInput


class DefaultRecommendationService(RecommendationService):
    async def recommend(self, inp: PredictionInput) -> dict:
        return {
            "items": [
                {
                    "id": "R-1",
                    "title": "Reduce overload for high-risk teachers",
                    "category": "Workload Balancing",
                    "impact": "high",
                    "description": "Adjust weekly hours and redistribute classes to reduce burnout risk.",
                    "confidence": 0.83,
                },
                {
                    "id": "R-2",
                    "title": "Targeted retention support",
                    "category": "Retention",
                    "impact": "medium",
                    "description": "Offer mentoring and training hours to improve satisfaction and retention likelihood.",
                    "confidence": 0.71,
                },
            ]
        }

