#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Query

from backend.app.prediction.schema.prediction_history import (
    CreatePredictionHistoryParam,
    PredictionHistoryDetail,
    PredictionHistoryListItem,
    UpdatePredictionHistoryParam,
)
from backend.app.prediction.service.prediction_history_service import prediction_history_service
from backend.common.pagination import DependsPagination, PageData, paging_data
from backend.common.response.response_schema import (
    ResponseModel,
    ResponseSchemaModel,
    response_base,
)
from backend.common.security.jwt import CurrentUser, DependsJwtAuth

router = APIRouter(tags=['房价预测历史'])


@router.post('', summary='创建房价预测实例', dependencies=[DependsJwtAuth])
async def create_history(
    current_user: CurrentUser, obj: CreatePredictionHistoryParam
) -> ResponseSchemaModel[PredictionHistoryDetail]:
    instance = await prediction_history_service.create(user_id=current_user.id, obj=obj)
    return response_base.success(data=instance)


@router.get(
    '',
    summary='分页查询房价预测历史',
    dependencies=[DependsJwtAuth, DependsPagination],
)
async def list_history(
    current_user: CurrentUser,
    keyword: Annotated[str | None, Query()] = None,
    title: Annotated[str | None, Query()] = None,
    location: Annotated[str | None, Query()] = None,
    square_footage_min: Annotated[float | None, Query()] = None,
    square_footage_max: Annotated[float | None, Query()] = None,
    bedrooms_min: Annotated[float | None, Query()] = None,
    bedrooms_max: Annotated[float | None, Query()] = None,
    bathrooms_min: Annotated[float | None, Query()] = None,
    bathrooms_max: Annotated[float | None, Query()] = None,
    year_built_min: Annotated[int | None, Query()] = None,
    year_built_max: Annotated[int | None, Query()] = None,
    lot_size_min: Annotated[float | None, Query()] = None,
    lot_size_max: Annotated[float | None, Query()] = None,
    distance_min: Annotated[float | None, Query()] = None,
    distance_max: Annotated[float | None, Query()] = None,
    school_rating_min: Annotated[float | None, Query()] = None,
    school_rating_max: Annotated[float | None, Query()] = None,
    predicted_price_min: Annotated[float | None, Query()] = None,
    predicted_price_max: Annotated[float | None, Query()] = None,
    has_prediction: Annotated[bool | None, Query()] = None,
    created_at_start: Annotated[datetime | None, Query()] = None,
    created_at_end: Annotated[datetime | None, Query()] = None,
    updated_at_start: Annotated[datetime | None, Query()] = None,
    updated_at_end: Annotated[datetime | None, Query()] = None,
) -> ResponseSchemaModel[PageData[PredictionHistoryListItem]]:
    filters = {
        'keyword': keyword,
        'title': title,
        'location': location,
        'square_footage_min': square_footage_min,
        'square_footage_max': square_footage_max,
        'bedrooms_min': bedrooms_min,
        'bedrooms_max': bedrooms_max,
        'bathrooms_min': bathrooms_min,
        'bathrooms_max': bathrooms_max,
        'year_built_min': year_built_min,
        'year_built_max': year_built_max,
        'lot_size_min': lot_size_min,
        'lot_size_max': lot_size_max,
        'distance_min': distance_min,
        'distance_max': distance_max,
        'school_rating_min': school_rating_min,
        'school_rating_max': school_rating_max,
        'predicted_price_min': predicted_price_min,
        'predicted_price_max': predicted_price_max,
        'has_prediction': has_prediction,
        'created_at_start': created_at_start,
        'created_at_end': created_at_end,
        'updated_at_start': updated_at_start,
        'updated_at_end': updated_at_end,
    }
    queryset = await prediction_history_service.search(user_id=current_user.id, filters=filters)
    page = await paging_data(queryset)
    return response_base.success(data=page)


@router.get('/{pk}', summary='查看房价预测实例详情', dependencies=[DependsJwtAuth])
async def get_history(
    current_user: CurrentUser, pk: int
) -> ResponseSchemaModel[PredictionHistoryDetail]:
    instance = await prediction_history_service.get(user_id=current_user.id, pk=pk)
    return response_base.success(data=instance)


@router.put('/{pk}', summary='编辑房价预测实例', dependencies=[DependsJwtAuth])
async def update_history(
    current_user: CurrentUser, pk: int, obj: UpdatePredictionHistoryParam
) -> ResponseSchemaModel[PredictionHistoryDetail]:
    instance = await prediction_history_service.update(user_id=current_user.id, pk=pk, obj=obj)
    return response_base.success(data=instance)


@router.post('/{pk}/predict', summary='对房价预测实例再次预测', dependencies=[DependsJwtAuth])
async def predict_history(
    current_user: CurrentUser, pk: int
) -> ResponseSchemaModel[PredictionHistoryDetail]:
    instance = await prediction_history_service.predict_and_save(user_id=current_user.id, pk=pk)
    return response_base.success(data=instance)


@router.delete('/{pk}', summary='逻辑删除房价预测实例', dependencies=[DependsJwtAuth])
async def delete_history(current_user: CurrentUser, pk: int) -> ResponseModel:
    await prediction_history_service.delete(user_id=current_user.id, pk=pk)
    return response_base.success()
