from __future__ import annotations

from app.ml.base_service import PredictionResult
from app.ml.utils.json_serializable import to_jsonable
from app.services.ml.interfaces import PredictionInput


class PredictionRouter:
    """Central synchronous-ish dispatcher for module outputs.

    Keeps the FastAPI layer thin while models evolve.
    """

    async def run_enrollment(self, service, inp: PredictionInput) -> dict:
        return await service.forecast(inp)


