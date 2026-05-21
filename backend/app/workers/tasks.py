from __future__ import annotations

from celery import shared_task


@shared_task(name="ml.predictor.run")
def ml_predict_stub(payload: dict) -> dict:
    # Placeholder worker: later call ML services.
    return {"ok": True, "payload": payload}


@shared_task(name="reports.generate")
def generate_report_stub(report_id: str, payload: dict) -> dict:
    return {"ok": True, "report_id": report_id, "payload": payload}

