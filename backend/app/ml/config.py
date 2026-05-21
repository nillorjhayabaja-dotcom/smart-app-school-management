from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class ModelPaths:
    """Central place for model storage paths."""

    root: Path = Path("models")

    def forecasting(self) -> Path:
        return self.root / "forecasting"

    def retention(self) -> Path:
        return self.root / "retention"

    def risk(self) -> Path:
        return self.root / "risk"

    def recommendations(self) -> Path:
        return self.root / "recommendations"


MODEL_PATHS = ModelPaths()

