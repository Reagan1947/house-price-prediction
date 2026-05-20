#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from backend.common.exception import errors
from backend.core.conf import settings
from backend.core.path_conf import BASE_PATH


class PredictionService:
    @staticmethod
    def _artifact_dir() -> Path:
        configured_path = Path(settings.MODEL_ARTIFACTS_DIR).expanduser()
        artifacts_dir = configured_path if configured_path.is_absolute() else BASE_PATH.parent / configured_path
        artifacts_dir.mkdir(parents=True, exist_ok=True)
        return artifacts_dir.resolve()

    @classmethod
    def _model_path(cls) -> Path:
        return cls._artifact_dir() / 'model.joblib'

    @classmethod
    def _metrics_path(cls) -> Path:
        return cls._artifact_dir() / 'metrics.json'

    @classmethod
    def _metadata_path(cls) -> Path:
        return cls._artifact_dir() / 'metadata.json'

    @classmethod
    def _ensure_artifacts(cls) -> None:
        missing_paths = [
            str(path)
            for path in [cls._model_path(), cls._metrics_path(), cls._metadata_path()]
            if not path.exists()
        ]
        if missing_paths:
            raise errors.ServerError(msg=f'Model artifacts not found: {missing_paths}')

    @classmethod
    @lru_cache
    def load_model(cls) -> Any:
        cls._ensure_artifacts()
        return joblib.load(cls._model_path())

    @classmethod
    @lru_cache
    def load_metrics(cls) -> dict[str, Any]:
        cls._ensure_artifacts()
        return json.loads(cls._metrics_path().read_text(encoding='utf-8'))

    @classmethod
    @lru_cache
    def load_metadata(cls) -> dict[str, Any]:
        cls._ensure_artifacts()
        return json.loads(cls._metadata_path().read_text(encoding='utf-8'))

    @classmethod
    def _feature_columns(cls) -> list[str]:
        metadata = cls.load_metadata()
        feature_columns = metadata.get('feature_columns', [])
        if isinstance(feature_columns, list) and all(isinstance(column, str) for column in feature_columns):
            return feature_columns
        return []

    @classmethod
    def predict(cls, payload: list[dict[str, Any]]) -> dict[str, Any]:
        if not payload:
            raise errors.RequestError(msg='Input payload is empty')

        model = cls.load_model()
        input_df = pd.DataFrame(payload)
        feature_columns = cls._feature_columns()
        if feature_columns:
            missing_columns = [column for column in feature_columns if column not in input_df.columns]
            if missing_columns:
                raise errors.RequestError(msg=f'Missing required feature columns: {missing_columns}')
            feature_df = input_df[feature_columns]
        else:
            feature_df = input_df

        predictions = model.predict(feature_df)
        prediction_values = [float(value) for value in np.asarray(predictions, dtype=float).tolist()]

        return {
            'count': len(payload),
            'predictions': prediction_values,
        }

    @classmethod
    def model_info(cls) -> dict[str, Any]:
        model = cls.load_model()
        metrics = cls.load_metrics()
        metadata = cls.load_metadata()

        model_name = model.__class__.__name__
        coefficients: list[dict[str, float | str]] = []
        intercept: float | None = None

        estimator = model
        if hasattr(model, 'named_steps') and 'model' in model.named_steps:
            estimator = model.named_steps['model']
            model_name = estimator.__class__.__name__

        if hasattr(estimator, 'coef_'):
            raw_coef = np.ravel(np.asarray(estimator.coef_, dtype=float))
            feature_names: list[str]
            if hasattr(model, 'named_steps') and 'preprocessor' in model.named_steps:
                preprocessor = model.named_steps['preprocessor']
                feature_names = preprocessor.get_feature_names_out().tolist()
            else:
                feature_names = cls._feature_columns()

            if len(feature_names) != len(raw_coef):
                feature_names = [f'feature_{index}' for index in range(len(raw_coef))]

            coefficients = [
                {'feature': feature_name, 'coefficient': float(coef)}
                for feature_name, coef in zip(feature_names, raw_coef, strict=False)
            ]

        if hasattr(estimator, 'intercept_'):
            intercept_values = np.ravel(np.asarray(estimator.intercept_, dtype=float))
            if intercept_values.size > 0:
                intercept = float(intercept_values[0])

        return {
            'model_name': model_name,
            'model_path': str(cls._model_path()),
            'trained_at_utc': metadata.get('trained_at_utc'),
            'selected_model': metadata.get('selected_model'),
            'feature_columns': metadata.get('feature_columns', []),
            'intercept': intercept,
            'coefficients': coefficients,
            'metrics': metrics,
        }

    @classmethod
    def health(cls) -> dict[str, Any]:
        artifacts = {
            'model': cls._model_path().exists(),
            'metrics': cls._metrics_path().exists(),
            'metadata': cls._metadata_path().exists(),
        }
        status = 'ok' if all(artifacts.values()) else 'degraded'
        return {
            'status': status,
            'artifacts': artifacts,
            'artifacts_dir': str(cls._artifact_dir()),
        }
