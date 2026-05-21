from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def workload_distribution() -> list[dict]:
    # UI uses employeeService.list, but keep contract in case.
    return []

