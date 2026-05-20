#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from decimal import Decimal
from typing import Any

from tortoise.queryset import QuerySet

from backend.app.prediction.crud.crud_prediction_history import prediction_history_dao
from backend.app.prediction.model.prediction_history import PredictionHistory
from backend.app.prediction.schema.prediction_history import (
    CreatePredictionHistoryParam,
    UpdatePredictionHistoryParam,
)
from backend.app.prediction.service.prediction_service import PredictionService
from backend.common.exception import errors
from backend.utils.timezone import timezone

FEATURE_FIELDS = (
    'square_footage',
    'bedrooms',
    'bathrooms',
    'year_built',
    'lot_size',
    'distance_to_city_center',
    'school_rating',
)


class PredictionHistoryService:
    @staticmethod
    def _price_changed(before: Decimal | None, after: float | None) -> bool:
        if before is None and after is None:
            return False
        if before is None or after is None:
            return True
        return float(before) != after

    @staticmethod
    async def create(*, user_id: int, obj: CreatePredictionHistoryParam) -> PredictionHistory:
        data = obj.model_dump()
        if data.get('predicted_price') is not None:
            data['predicted_at'] = timezone.now()
        return await prediction_history_dao.create(user_id=user_id, data=data)

    @staticmethod
    async def get(*, user_id: int, pk: int) -> PredictionHistory:
        instance = await prediction_history_dao.get_by_user(pk=pk, user_id=user_id)
        if not instance:
            raise errors.NotFoundError(msg='Prediction history not found')
        return instance

    @staticmethod
    async def update(
        *, user_id: int, pk: int, obj: UpdatePredictionHistoryParam
    ) -> PredictionHistory:
        instance = await PredictionHistoryService.get(user_id=user_id, pk=pk)
        data = obj.model_dump()
        data.pop('predicted_at', None)
        if data.get('predicted_price') is None:
            data['predicted_at'] = None
        elif PredictionHistoryService._price_changed(instance.predicted_price, data['predicted_price']):
            data['predicted_at'] = timezone.now()
        await prediction_history_dao.update_by_id(pk=pk, user_id=user_id, data=data)
        return await PredictionHistoryService.get(user_id=user_id, pk=pk)

    @staticmethod
    async def predict_and_save(*, user_id: int, pk: int) -> PredictionHistory:
        instance = await PredictionHistoryService.get(user_id=user_id, pk=pk)
        features = {field: float(getattr(instance, field)) for field in FEATURE_FIELDS}
        result = PredictionService.predict([features])
        predicted_price = float(result['predictions'][0])
        await prediction_history_dao.update_by_id(
            pk=pk,
            user_id=user_id,
            data={'predicted_price': predicted_price, 'predicted_at': timezone.now()},
        )
        return await PredictionHistoryService.get(user_id=user_id, pk=pk)

    @staticmethod
    async def delete(*, user_id: int, pk: int) -> int:
        count = await prediction_history_dao.soft_delete(pk=pk, user_id=user_id)
        if not count:
            raise errors.NotFoundError(msg='Prediction history not found')
        return count

    @staticmethod
    async def search(*, user_id: int, filters: dict[str, Any]) -> QuerySet:
        return prediction_history_dao.get_search_queryset(user_id=user_id, filters=filters)


prediction_history_service = PredictionHistoryService()
