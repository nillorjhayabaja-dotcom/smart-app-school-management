from __future__ import annotations

from typing import Any

from app.ml.models.recommendations.recommender import (
    RecommendationContext,
    RecommendationItem,
    rule_based_recommendations,
    content_based_filtering,
)
from app.ml.utils.json_serializable import to_jsonable
from app.services.ml.interfaces import PredictionInput


class AutomatedRecommendationMLService:
    """Module 5: Automated Recommendations.

    Payload expected (minimal):
    {
      "risk_level": "low"|"medium"|"high" (optional),
      "risk_score": float (optional),
      "retention_risk": float (optional),
      "workload_overload": float (optional),
      "preferred_categories": ["Retention", "Workload Balancing"] (optional)
    }
    """

    async def recommend(self, inp: PredictionInput) -> dict:
        payload: dict[str, Any] = inp.payload or {}

        ctx = RecommendationContext(
            risk_level=payload.get("risk_level"),
            risk_score=payload.get("risk_score"),
            retention_risk=payload.get("retention_risk"),
            workload_overload=payload.get("workload_overload"),
        )

        pref = payload.get("preferred_categories")
        items: list[RecommendationItem] = rule_based_recommendations(ctx)
        items = content_based_filtering(items, preferred_categories=pref)

        return {
            "items": [
                {
                    "id": it.id,
                    "title": it.title,
                    "category": it.category,
                    "impact": it.impact,
                    "description": it.description,
                    "confidence": float(it.confidence),
                }
                for it in items
            ],
            "meta": to_jsonable({"model": "rule_based+content"}),
        }

