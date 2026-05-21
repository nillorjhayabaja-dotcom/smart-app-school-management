from __future__ import annotations

from app.services.ml.interfaces import PredictionInput


async def flexible_scheduling(inp: PredictionInput) -> dict:
    """Return flexible scheduling suggestions.

    Contract (used by UI):
    {
      "data": [
        {
          "day": str,
          "start": str,
          "subject": str,
          "employeeName": str,
          "room": str,
          "conflict": bool
        }
      ]
    }
    """

    # Keep existing test behavior for empty/invalid payload
    if not getattr(inp, "payload", None):
        return {"data": []}

    # Lightweight deterministic mock based on payload; avoids heavy ML deps.
    day = inp.payload.get("day", "Mon")
    start = inp.payload.get("start", "08:00")
    subject = inp.payload.get("subject", "Algebra")
    employee_name = inp.payload.get("employeeName", "Alice Johnson")
    room = inp.payload.get("room", "Room A")

    # Simple conflict heuristic (payload can override)
    conflict = bool(inp.payload.get("conflict", False))

    return {
        "data": [
            {
                "id": "S-1",
                "day": day,
                "start": start,
                "subject": subject,
                "employeeName": employee_name,
                "room": room,
                "conflict": conflict,
            }
        ]
    }


