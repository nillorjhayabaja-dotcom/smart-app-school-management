from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Sequence

import numpy as np
import pandas as pd


def ensure_dataframe(data: pd.DataFrame | dict | list) -> pd.DataFrame:
    if isinstance(data, pd.DataFrame):
        return data
    return pd.DataFrame(data)


@dataclass(frozen=True)
class PreprocessorConfig:
    target_col: str
    date_col: str | None = None
    feature_cols: Sequence[str] | None = None


def basic_preprocess(df: pd.DataFrame, *, config: PreprocessorConfig) -> tuple[np.ndarray, np.ndarray, list[str]]:
    """Shared preprocessing: missing values + optional feature selection."""
    if config.target_col not in df.columns:
        raise ValueError(f"target_col='{config.target_col}' not found in dataframe")

    work = df.copy()

    # Handle missing values
    for col in work.columns:
        if work[col].dtype.kind in "biufc":
            work[col] = work[col].fillna(work[col].median())
        else:
            work[col] = work[col].fillna("__missing__")

    if config.feature_cols:
        feature_cols = list(config.feature_cols)
    else:
        feature_cols = [c for c in work.columns if c not in {config.target_col, config.date_col}]

    X = work[feature_cols]

    # If any non-numeric columns exist, one-hot encode
    non_numeric = [c for c in feature_cols if X[c].dtype.kind not in "biufc"]
    if non_numeric:
        X = pd.get_dummies(X, columns=non_numeric, dummy_na=True)
        feature_cols = list(X.columns)

    y = work[config.target_col].astype(float).to_numpy()

    # convert to numeric array
    Xv = X.astype(float).to_numpy()

    return Xv, y, feature_cols

