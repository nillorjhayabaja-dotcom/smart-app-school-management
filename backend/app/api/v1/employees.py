from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_employees() -> list[dict]:
    # Stub data aligned with React UI fields used for risk/workload.
    return [
        {
            "id": "E-1",
            "name": "Alice Johnson",
            "department": "Mathematics",
            "workload": 95,
            "performance": 78,
            "retentionRisk": "high",
        },
        {
            "id": "E-2",
            "name": "Brian Lee",
            "department": "Science",
            "workload": 72,
            "performance": 84,
            "retentionRisk": "medium",
        },
        {
            "id": "E-3",
            "name": "Chloe Kim",
            "department": "English",
            "workload": 48,
            "performance": 70,
            "retentionRisk": "low",
        },
    ]


@router.get("/{employee_id}")
async def get_employee(employee_id: str) -> dict:
    return {
        "id": employee_id,
        "name": "Stub",
        "department": "Stub",
        "workload": 60,
        "performance": 80,
        "retentionRisk": "medium",
    }

