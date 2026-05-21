from fastapi import APIRouter

router = APIRouter()


@router.post("/enrollment")
async def enrollment_forecast(payload: dict) -> dict:
    """Module 1: Enrollment forecasting.

    Payload schema follows StudentEnrollmentForecastingService.
    """
    from app.services.ml.forecasting_service import StudentEnrollmentForecastingService
    from app.services.ml.interfaces import PredictionInput

    svc = StudentEnrollmentForecastingService()
    return await svc.forecast(PredictionInput(payload=payload))



@router.post("/retention")
async def retention_trend(payload: dict) -> dict:
    """Module 2: Teacher retention prediction."""
    from app.services.ml.retention_service import TeacherRetentionPredictionService
    from app.services.ml.interfaces import PredictionInput

    svc = TeacherRetentionPredictionService()
    return await svc.predict_retention(PredictionInput(payload=payload))



@router.post("/trend")
async def trend_identification(payload: dict) -> dict:
    """Module 3: Trend identification.

    Expects payload: {"x": [...], "y": [...]}.
    """
    from app.services.ml.interfaces import PredictionInput
    from app.services.ml.trend_analysis_service import TrendIdentificationService

    svc = TrendIdentificationService()
    return await svc.identify_trend(PredictionInput(payload=payload))


@router.get("/risk")
async def workload_by_dept() -> dict:
    # UI may call analyticsService.workloadByDept() via /analytics/workload
    return {"data": []}



@router.get("/workload/distribution")
async def workload_distribution() -> dict:
    return {"data": []}



@router.get("/scatter")
async def performance_scatter() -> dict:
    return {
        "data": [
            {"workload": 70, "performance": 82},
            {"workload": 95, "performance": 76},
            {"workload": 45, "performance": 68},
        ]
    }


@router.get("/activity")
async def active_vs_inactive() -> dict:
    return {"data": []}

