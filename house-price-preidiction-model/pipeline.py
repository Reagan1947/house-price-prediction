from __future__ import annotations

from sklearn.compose import ColumnTransformer, make_column_selector
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


def build_preprocessor() -> ColumnTransformer:
    numeric_pipeline = Pipeline(
        steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler()),
        ]
    )
    categorical_pipeline = Pipeline(
        steps=[
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('encoder', OneHotEncoder(handle_unknown='ignore')),
        ]
    )
    return ColumnTransformer(
        transformers=[
            ('num', numeric_pipeline, make_column_selector(dtype_include='number')),
            (
                'cat',
                categorical_pipeline,
                make_column_selector(dtype_include=['object', 'category', 'bool']),
            ),
        ]
    )


def build_baseline_pipeline() -> Pipeline:
    return Pipeline(
        steps=[
            ('preprocessor', build_preprocessor()),
            ('model', LinearRegression()),
        ]
    )

