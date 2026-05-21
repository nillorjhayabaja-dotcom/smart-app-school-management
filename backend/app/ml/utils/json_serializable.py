from __future__ import annotations

from dataclasses import asdict, is_dataclass
from typing import Any

import numpy as np


def to_jsonable(obj: Any) -> Any:
    """Convert common scientific objects into JSON-serializable forms."""
    if obj is None:
        return None

    if is_dataclass(obj):
        return asdict(obj)

    if isinstance(obj, (str, int, float, bool)):
        return obj

    # numpy scalars
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, (np.bool_,)):
        return bool(obj)

    if isinstance(obj, np.ndarray):
        return obj.tolist()

    if isinstance(obj, dict):
        return {str(k): to_jsonable(v) for k, v in obj.items()}

    if isinstance(obj, (list, tuple)):
        return [to_jsonable(v) for v in obj]

    # fallback: try to coerce via string
    try:
        return float(obj)  # type: ignore[arg-type]
    except Exception:
        return str(obj)

