from __future__ import annotations

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
from sklearn.dummy import DummyRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from data_io import load_training_dataframe, save_artifacts
from pipeline import build_baseline_pipeline


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Train baseline house-price model.')
    parser.add_argument('--data-path', required=True, help='CSV path for training data.')
    parser.add_argument(
        '--target-column',
        default='price',
        help='Target column name in the CSV. Default: price',
    )
    parser.add_argument(
        '--drop-columns',
        default='',
        help='Comma-separated columns to drop before training.',
    )
    parser.add_argument(
        '--artifacts-dir',
        default='machine-learning/artifacts',
        help='Directory to write model and metrics.',
    )
    parser.add_argument(
        '--test-size',
        type=float,
        default=0.15,
        help='Test split ratio, default 0.15.',
    )
    parser.add_argument(
        '--val-size',
        type=float,
        default=0.15,
        help='Validation split ratio, default 0.15.',
    )
    parser.add_argument(
        '--random-state',
        type=int,
        default=42,
        help='Random seed for split and reproducibility.',
    )
    parser.add_argument(
        '--log-transform-target',
        action='store_true',
        help='Apply log1p transform on target during training.',
    )
    parser.add_argument(
        '--encoding',
        default='utf-8',
        help='CSV file encoding. Default: utf-8',
    )
    return parser.parse_args()


def evaluate_regression(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    return {
        'mae': float(mean_absolute_error(y_true, y_pred)),
        'rmse': float(np.sqrt(mean_squared_error(y_true, y_pred))),
        'r2': float(r2_score(y_true, y_pred)),
    }


def fit_predict_with_optional_log_target(
    model: Any,
    x_train: Any,
    y_train: np.ndarray,
    x_eval: Any,
    use_log_target: bool,
) -> np.ndarray:
    if use_log_target:
        if (y_train < 0).any():
            raise ValueError('Target contains negative values; log1p transform is not applicable.')
        model.fit(x_train, np.log1p(y_train))
        pred = model.predict(x_eval)
        return np.expm1(pred)
    model.fit(x_train, y_train)
    return model.predict(x_eval)


def main() -> None:
    args = parse_args()
    if args.test_size <= 0 or args.val_size <= 0 or args.test_size + args.val_size >= 1:
        raise ValueError('Invalid split ratios: require test_size > 0, val_size > 0 and sum < 1.')

    df = load_training_dataframe(args.data_path, encoding=args.encoding)

    drop_columns = [c.strip() for c in args.drop_columns.split(',') if c.strip()]
    for column in drop_columns:
        if column in df.columns:
            df = df.drop(columns=column)

    if args.target_column not in df.columns:
        raise KeyError(
            f'Target column "{args.target_column}" not found. '
            f'Available columns: {list(df.columns)}'
        )
    if len(df) < 10:
        raise ValueError('Dataset is too small for split training. Need at least 10 rows.')

    x = df.drop(columns=args.target_column)
    y = df[args.target_column].astype(float).to_numpy()

    x_train_val, x_test, y_train_val, y_test = train_test_split(
        x,
        y,
        test_size=args.test_size,
        random_state=args.random_state,
    )
    val_ratio_in_train_val = args.val_size / (1 - args.test_size)
    x_train, x_val, y_train, y_val = train_test_split(
        x_train_val,
        y_train_val,
        test_size=val_ratio_in_train_val,
        random_state=args.random_state,
    )

    models = {
        'dummy_median': DummyRegressor(strategy='median'),
        'linear_regression': build_baseline_pipeline(),
    }
    metrics: dict[str, dict[str, dict[str, float]]] = {}
    fitted_models: dict[str, Any] = {}

    for model_name, model in models.items():
        val_pred = fit_predict_with_optional_log_target(
            model=model,
            x_train=x_train,
            y_train=y_train,
            x_eval=x_val,
            use_log_target=args.log_transform_target,
        )
        test_pred = model.predict(x_test)
        if args.log_transform_target:
            test_pred = np.expm1(test_pred)

        metrics[model_name] = {
            'validation': evaluate_regression(y_val, val_pred),
            'test': evaluate_regression(y_test, test_pred),
        }
        fitted_models[model_name] = model

    best_model_name = min(metrics, key=lambda name: metrics[name]['validation']['rmse'])
    best_model = fitted_models[best_model_name]
    metadata = {
        'trained_at_utc': datetime.now(timezone.utc).isoformat(),
        'data_path': str(Path(args.data_path)),
        'target_column': args.target_column,
        'dropped_columns': drop_columns,
        'feature_columns': list(x.columns),
        'row_count': len(df),
        'split': {
            'train_rows': len(x_train),
            'validation_rows': len(x_val),
            'test_rows': len(x_test),
            'test_size': args.test_size,
            'val_size': args.val_size,
        },
        'log_transform_target': args.log_transform_target,
        'selected_model': best_model_name,
    }

    save_artifacts(
        artifacts_dir=args.artifacts_dir,
        model=best_model,
        metrics=metrics,
        metadata=metadata,
    )

    print(f'Training completed. Best model: {best_model_name}')
    print(f'Artifacts saved in: {Path(args.artifacts_dir).resolve()}')


if __name__ == '__main__':
    main()
