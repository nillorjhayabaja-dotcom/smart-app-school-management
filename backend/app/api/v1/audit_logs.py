from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_audit_logs() -> list[dict]:
    return []

