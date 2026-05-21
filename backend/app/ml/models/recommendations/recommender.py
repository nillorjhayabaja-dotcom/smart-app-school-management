from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np


@dataclass(frozen=True)
class RecommendationItem:
    id: str
    title: str
    category: str
    impact: str
    description: str
    confidence: float


@dataclass(frozen=True)
class RecommendationContext:
    risk_level: str | None = None
    risk_score: float | None = None
    retention_risk: float | None = None
    workload_overload: float | None = None


def rule_based_recommendations(ctx: RecommendationContext) -> list[RecommendationItem]:
    items: list[RecommendationItem] = []

    # Workload balancing
    if ctx.workload_overload is not None and ctx.workload_overload > 0.6:
        items.append(
            RecommendationItem(
                id="R-WB-1",
                title="Redistribute classes to reduce overload",
                category="Workload Balancing",
                impact="high",
                description="Adjust weekly hours and redistribute subjects to reduce burnout risk.",
                confidence=0.82,
            )
        )

    # Risk
    if (ctx.risk_level or "").lower() == "high":
        items.append(
            RecommendationItem(
                id="R-RISK-1",
                title="Mitigate high-risk staffing patterns",
                category="Risk Mitigation",
                impact="high",
                description="Implement targeted interventions for departments/teachers with highest risk drivers.",
                confidence=0.78,
            )
        )

    # Retention
    if ctx.retention_risk is not None and ctx.retention_risk > 0.5:
        items.append(
            RecommendationItem(
                id="R-RET-1",
                title="Target retention support program",
                category="Retention",
                impact="medium",
                description="Provide mentoring, training hours, and wellbeing support to improve retention likelihood.",
                confidence=0.71,
            )
        )

    # Fallback
    if not items:
        items.append(
            RecommendationItem(
                id="R-BASE-1",
                title="Continuous staffing optimization",
                category="Operations",
                impact="medium",
                description="Run periodic workload and retention checks to keep staffing aligned with demand.",
                confidence=0.6,
            )
        )

    return items


def content_based_filtering(all_items: list[RecommendationItem], *, preferred_categories: list[str] | None) -> list[RecommendationItem]:
    if not preferred_categories:
        return all_items

    pref = {c.lower() for c in preferred_categories}
    scored: list[tuple[RecommendationItem, float]] = []
    for it in all_items:
        cat = it.category.lower()
        score = 1.0 if cat in pref else 0.0
        scored.append((it, score))

    scored.sort(key=lambda t: t[1], reverse=True)
    # return top-N preserving confidence ordering within ties
    top = [t[0] for t in scored[:3]]
    top.sort(key=lambda x: x.confidence, reverse=True)
    return top

