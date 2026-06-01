from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.employees import router as employees_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.risk import router as risk_router
from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.workload import router as workload_router
from app.api.v1.scheduling import router as scheduling_router
from app.api.v1.reports import router as reports_router
from app.api.v1.audit_logs import router as audit_logs_router
from app.api.v1.settings import router as settings_router
from app.api.v1.notifications import router as notifications_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(employees_router, prefix="/employees", tags=["employees"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
api_router.include_router(risk_router, prefix="/risk", tags=["risk"])
api_router.include_router(
    recommendations_router, prefix="/recommendations", tags=["recommendations"]
)
api_router.include_router(workload_router, prefix="/workload", tags=["workload"])
api_router.include_router(scheduling_router, prefix="/scheduling", tags=["scheduling"])
api_router.include_router(reports_router, prefix="/reports", tags=["reports"])
api_router.include_router(audit_logs_router, prefix="/audit-logs", tags=["audit-logs"])
api_router.include_router(settings_router, prefix="/settings", tags=["settings"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["notifications"])

