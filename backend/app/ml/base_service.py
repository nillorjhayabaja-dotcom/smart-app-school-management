from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any, Optional

from app.ml.utils.json_serializable import to_jsonable


@dataclass(frozen=True)
class PredictionResult:
    data: Any
    meta: Optional[dict[str, Any]] = None

    def to_json(self) -> dict[str, Any]:
        return {
            "data": to_jsonable(self.data),
            "meta": to_jsonable(self.meta),
        }


class AsyncModelMixin:
    """Run CPU-bound training/prediction in a thread to keep FastAPI responsive."""

    async def run_in_thread(self, fn, *args, **kwargs):
        return await asyncio.to_thread(fn, *args, **kwargs)

