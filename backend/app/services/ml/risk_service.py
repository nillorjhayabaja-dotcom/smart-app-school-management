from __future__ import annotations

from typing import Any

from app.ml.models.risk.risk_scoring import weighted_risk_score
from app.ml.utils.json_serializable import to_jsonable
from app.services.ml.interfaces import PredictionInput


class RiskAssessmentService:
    """Module 4: Risk assessment.

    Payload expected:
    {
      "workload": 0-1,
      "satisfaction": 0-1,
      "resignations": 0-1,
      "performance": 0-1,
      "student_feedback": 0-1,
      "weights": { ... } (optional)
    }
    """

    async def assess_risk(self, inp: PredictionInput) -> dict:
        payload: dict[str, Any] = inp.payload or {}

        required = ["workload", "satisfaction", "resignations", "performance", "student_feedback"]
        if not all(k in payload for k in required):
            return {
                "data": {
                    "score": 0.0,
                    "level": "insufficient_data",
                    "explanation": [],
                },
                "meta": {"model": "risk_stub"},
            }

        out = weighted_risk_score(
            workload=payload["workload"],
            satisfaction=payload["satisfaction"],
            resignations=payload["resignations"],
            performance=payload["performance"],
            student_feedback=payload["student_feedback"],
            weights=payload.get("weights"),
        )

        return {
            "data": {
                "score": out.score,
                "level": out.level,
                "explanation": out.explanation,
            },
            "meta": to_jsonable({"model": "weighted_risk"}),
        }

