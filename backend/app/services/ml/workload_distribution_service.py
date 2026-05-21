from __future__ import annotations

from app.services.ml.interfaces import PredictionInput


async def dynamic_workload_distribution(inp: PredictionInput) -> dict:
    return {"data": []}

