from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class RetentionDerivedOutputs:
    retention_prediction: float
    resignation_probability: float
    hiring_requirement: int


def derive_resignation_from_retention(retention_value: float) -> float:
    """Map retention prediction into an approximate resignation probability.

    Assumes retention_value is in [0, 1]. If outside, we clamp.
    """
    r = float(retention_value)
    r = max(0.0, min(1.0, r))
    return 1.0 - r


def derive_hiring_requirement(resignation_probability: float, current_teachers: int, target_teacher_count: int) -> int:
    """Compute required hiring as max(0, target - expected_remaining)."""
    current_teachers = int(current_teachers)
    target_teacher_count = int(target_teacher_count)

    resignation_probability = float(resignation_probability)
    expected_remaining = current_teachers * (1.0 - resignation_probability)
    needed = target_teacher_count - expected_remaining
    # Expected number can be fractional; round up conservatively.
    return int(max(0, int(-(-needed // 1))))

