from __future__ import annotations

from app.services.ml.interfaces import PredictionInput


class PredictionOrchestrator:
    """Orchestrates ML calls across forecasting/risk/recommendations.

    This keeps the API layer stable while swapping models.
    """

    async def run_all(self, inp: PredictionInput) -> dict:
        # Stub orchestrator
        return {
            "enrollment": {"data": []},
            "retention": {"data": []},
            "risk": {"data": []},
            "recommendations": {"items": []},
        }

