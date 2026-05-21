from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class RiskScoreOutput:
    score: float
    level: str
    explanation: list[dict[str, Any]]


def weighted_risk_score(
    workload: float,
    satisfaction: float,
    resignations: float,
    performance: float,
    student_feedback: float,
    *,
    weights: dict[str, float] | None = None,
) -> RiskScoreOutput:
    """Weighted risk score in [0,100].

    Inputs expected normalized to [0,1] where higher workload/resignations/performance_failure
    increases risk, and satisfaction decreases risk.

    Returns explanation terms.
    """
    weights = weights or {
        "workload": 0.25,
        "satisfaction": 0.20,
        "resignations": 0.20,
        "performance": 0.20,
        "student_feedback": 0.15,
    }

    # clamp
    def c(v: float) -> float:
        return max(0.0, min(1.0, float(v)))

    workload = c(workload)
    satisfaction = c(satisfaction)
    resignations = c(resignations)
    performance = c(performance)
    student_feedback = c(student_feedback)

    # satisfaction inversely contributes to risk
    risk_components = {
        "workload": workload,
        "satisfaction": 1.0 - satisfaction,
        "resignations": resignations,
        "performance": performance,
        "student_feedback": student_feedback,
    }

    total_w = sum(weights.values())
    score01 = sum(risk_components[k] * weights.get(k, 0.0) for k in risk_components) / (total_w or 1.0)
    score = float(score01 * 100.0)

    # risk level
    if score < 35:
        level = "low"
    elif score < 65:
        level = "medium"
    else:
        level = "high"

    explanation = [
        {"factor": k, "weight": weights.get(k, 0.0), "contribution": risk_components[k] * weights.get(k, 0.0)}
        for k in risk_components
    ]

    return RiskScoreOutput(score=score, level=level, explanation=explanation)

