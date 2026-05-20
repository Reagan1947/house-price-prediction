#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from fastapi import APIRouter

from backend.app.prediction.schema.prediction import HouseFeatures
from backend.app.prediction.service.prediction_service import PredictionService
from backend.common.response.response_schema import ResponseModel, response_base

router = APIRouter(tags=['房价预测'])


@router.post('/predict', summary='房价预测（支持单笔与批次）')
async def predict(payload: HouseFeatures | list[HouseFeatures]) -> ResponseModel:
    if isinstance(payload, list):
        rows = [item.model_dump() for item in payload]
        prediction = PredictionService.predict(rows)
        return response_base.success(data={'mode': 'batch', **prediction})

    prediction = PredictionService.predict([payload.model_dump()])
    return response_base.success(
        data={
            'mode': 'single',
            'count': 1,
            'prediction': prediction['predictions'][0],
            'predictions': prediction['predictions'],
        }
    )


@router.get('/model-info', summary='模型信息与效能指标')
async def model_info() -> ResponseModel:
    info = PredictionService.model_info()
    return response_base.success(data=info)


@router.get('/health', summary='模型健康检查')
async def health() -> ResponseModel:
    health_data = PredictionService.health()
    return response_base.success(data=health_data)

