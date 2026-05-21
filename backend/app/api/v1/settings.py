from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def get_settings() -> dict:
    return {
        "ml": {
            "enabled": False,
            "risk_thresholds": {"low": 0.33, "medium": 0.66},
        }
    }

