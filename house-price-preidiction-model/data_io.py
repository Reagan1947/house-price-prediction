from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import pandas as pd


def load_training_dataframe(path: str | Path, encoding: str = 'utf-8') -> pd.DataFrame:
    file_path = Path(path)
    if not file_path.exists():
        raise FileNotFoundError(f'Data file not found: {file_path}')
    return pd.read_csv(file_path, encoding=encoding)


def save_json(path: Path, data: dict[str, Any]) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')


def save_artifacts(
    artifacts_dir: str | Path,
    model: Any,
    metrics: dict[str, Any],
    metadata: dict[str, Any],
) -> None:
    output_dir = Path(artifacts_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, output_dir / 'model.joblib')
    save_json(output_dir / 'metrics.json', metrics)
    save_json(output_dir / 'metadata.json', metadata)

