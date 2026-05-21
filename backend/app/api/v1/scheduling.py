from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_schedules() -> list[dict]:
    # UI expects schedule entries:
    # {day,start,subject,employeeName,room,conflict}
    return [

        {
            "id": "S-1",
            "day": "Mon",
            "start": "08:00",
            "subject": "Algebra",
            "employeeName": "Alice Johnson",
            "room": "Room A",
            "conflict": False,
        },
        {
            "id": "S-2",
            "day": "Tue",
            "start": "10:00",
            "subject": "Physics",
            "employeeName": "Brian Lee",
            "room": "Room B",
            "conflict": True,
        },
    ]


