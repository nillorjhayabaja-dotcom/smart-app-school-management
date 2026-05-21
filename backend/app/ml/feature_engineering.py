from __future__ import annotations

import numpy as np
import pandas as pd


def add_student_teacher_ratio(df: pd.DataFrame, *, students_col: str, teachers_col: str, out_col: str = "student_teacher_ratio") -> pd.DataFrame:
    work = df.copy()
    if teachers_col not in work.columns or students_col not in work.columns:
        raise ValueError("Required columns missing for ratio")

    # avoid division by zero
    teachers = work[teachers_col].replace({0: np.nan})
    work[out_col] = (work[students_col] / teachers).fillna(0.0)
    return work

