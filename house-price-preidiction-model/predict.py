from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import joblib
import pandas as pd


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Predict house prices from a trained model.')
    parser.add_argument(
        '--model-path',
        default='machine-learning/artifacts/model.joblib',
        help='Path to trained model file. Default: machine-learning/artifacts/model.joblib',
    )
    parser.add_argument('--input-path', required=True, help='Input CSV path for prediction.')
    parser.add_argument(
        '--output-path',
        default='machine-learning/artifacts/predictions.csv',
        help='Output CSV path. Default: machine-learning/artifacts/predictions.csv',
    )
    parser.add_argument(
        '--metadata-path',
        default='',
        help='Optional metadata.json path. If omitted, infer from model directory.',
    )
    parser.add_argument(
        '--prediction-column',
        default='predicted_price',
        help='Prediction column name in output CSV. Default: predicted_price',
    )
    parser.add_argument(
        '--drop-columns',
        default='',
        help='Comma-separated columns to drop from input before prediction.',
    )
    parser.add_argument(
        '--encoding',
        default='utf-8',
        help='CSV file encoding. Default: utf-8',
    )
    parser.add_argument(
        '--round',
        type=int,
        default=2,
        help='Round digits for predicted values. Use negative to disable rounding.',
    )
    return parser.parse_args()


def load_feature_columns(metadata_path: Path) -> list[str]:
    if not metadata_path.exists():
        return []
    metadata = json.loads(metadata_path.read_text(encoding='utf-8'))
    feature_columns = metadata.get('feature_columns', [])
    if isinstance(feature_columns, list) and all(isinstance(c, str) for c in feature_columns):
        return feature_columns
    return []


def prepare_features(
    df: pd.DataFrame, feature_columns: list[str], drop_columns: list[str]
) -> tuple[pd.DataFrame, pd.DataFrame]:
    original_df = df.copy()
    for column in drop_columns:
        if column in df.columns:
            df = df.drop(columns=column)
            original_df = original_df.drop(columns=column)

    if feature_columns:
        missing_columns = [column for column in feature_columns if column not in df.columns]
        if missing_columns:
            raise KeyError(f'Missing required feature columns: {missing_columns}')
        return original_df, df[feature_columns]
    return original_df, df


def main() -> None:
    args = parse_args()

    model_path = Path(args.model_path)
    if not model_path.exists():
        raise FileNotFoundError(f'Model file not found: {model_path}')

    if args.metadata_path:
        metadata_path = Path(args.metadata_path)
    else:
        metadata_path = model_path.parent / 'metadata.json'

    input_df = pd.read_csv(args.input_path, encoding=args.encoding)
    if input_df.empty:
        raise ValueError(f'Input dataset is empty: {args.input_path}')

    drop_columns = [c.strip() for c in args.drop_columns.split(',') if c.strip()]
    feature_columns = load_feature_columns(metadata_path)
    output_df, feature_df = prepare_features(
        df=input_df,
        feature_columns=feature_columns,
        drop_columns=drop_columns,
    )

    model: Any = joblib.load(model_path)
    predictions = model.predict(feature_df)
    if args.round >= 0:
        predictions = predictions.round(args.round)

    output_df[args.prediction_column] = predictions
    output_path = Path(args.output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_df.to_csv(output_path, index=False, encoding='utf-8')

    print(f'Prediction completed. Rows: {len(output_df)}')
    print(f'Output saved in: {output_path.resolve()}')


if __name__ == '__main__':
    main()

