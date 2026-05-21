# TODO — Module 1 Student Enrollment Forecasting (production hardening)

- [ ] Add model persistence (joblib)
  - [ ] Save/load the RF pipeline + metadata under `backend/models/forecasting/`
  - [ ] Use paths from `backend/app/ml/config.py`
- [ ] Add unit tests (pytest)
  - [ ] Test `basic_preprocess`
  - [ ] Test `EnrollmentForecastPipeline.fit/predict`
  - [ ] Test `StudentEnrollmentForecastingService.forecast()` JSON contract
- [ ] Run compile
- [ ] Run pytest

