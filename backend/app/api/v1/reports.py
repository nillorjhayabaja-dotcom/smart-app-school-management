from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_reports() -> list[dict]:
    # UI expects: {id,name,type,size,createdAt}
    return [
        {
            "id": "RPT-1",
            "name": "Q3 Workforce Allocation",
            "type": "PDF",
            "size": "1.2 MB",
            "createdAt": "2026-01-01T00:00:00.000Z",
        },
        {
            "id": "RPT-2",
            "name": "Retention Forecast — FY25",
            "type": "XLSX",
            "size": "642 KB",
            "createdAt": "2026-01-01T00:00:00.000Z",
        },
    ]

