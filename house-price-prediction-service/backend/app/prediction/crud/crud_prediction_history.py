#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from typing import Any

from tortoise.expressions import Q
from tortoise.queryset import QuerySet
from tortoise.transactions import atomic

from backend.app.prediction.model.prediction_history import PredictionHistory
from backend.common.crud import CRUDBase
from backend.utils.timezone import timezone


class CRUDPredictionHistory(CRUDBase[PredictionHistory]):
    async def get_by_user(self, pk: int, user_id: int) -> PredictionHistory | None:
        return await self.model.filter(id=pk, user_id=user_id, is_deleted=False).first()

    @atomic()
    async def create(self, user_id: int, data: dict[str, Any]) -> PredictionHistory:
        return await self.model.create(user_id=user_id, **data)

    @atomic()
    async def update_by_id(self, pk: int, user_id: int, data: dict[str, Any]) -> int:
        return await self.model.filter(id=pk, user_id=user_id, is_deleted=False).update(**data)

    @atomic()
    async def soft_delete(self, pk: int, user_id: int) -> int:
        return await self.model.filter(id=pk, user_id=user_id, is_deleted=False).update(
            is_deleted=True, deleted_at=timezone.now()
        )

    def get_search_queryset(self, user_id: int, filters: dict[str, Any]) -> QuerySet:
        qs = self.model.filter(user_id=user_id, is_deleted=False)

        keyword = filters.get('keyword')
        if keyword:
            qs = qs.filter(Q(title__icontains=keyword) | Q(location__icontains=keyword))

        if filters.get('title'):
            qs = qs.filter(title__icontains=filters['title'])
        if filters.get('location'):
            qs = qs.filter(location__icontains=filters['location'])

        for field, min_key, max_key in [
            ('square_footage', 'square_footage_min', 'square_footage_max'),
            ('bedrooms', 'bedrooms_min', 'bedrooms_max'),
            ('bathrooms', 'bathrooms_min', 'bathrooms_max'),
            ('year_built', 'year_built_min', 'year_built_max'),
            ('lot_size', 'lot_size_min', 'lot_size_max'),
            ('distance_to_city_center', 'distance_min', 'distance_max'),
            ('school_rating', 'school_rating_min', 'school_rating_max'),
            ('predicted_price', 'predicted_price_min', 'predicted_price_max'),
        ]:
            if filters.get(min_key) is not None:
                qs = qs.filter(**{f'{field}__gte': filters[min_key]})
            if filters.get(max_key) is not None:
                qs = qs.filter(**{f'{field}__lte': filters[max_key]})

        has_prediction = filters.get('has_prediction')
        if has_prediction is True:
            qs = qs.filter(predicted_price__isnull=False)
        elif has_prediction is False:
            qs = qs.filter(predicted_price__isnull=True)

        if filters.get('created_at_start'):
            qs = qs.filter(created_at__gte=filters['created_at_start'])
        if filters.get('created_at_end'):
            qs = qs.filter(created_at__lte=filters['created_at_end'])
        if filters.get('updated_at_start'):
            qs = qs.filter(updated_at__gte=filters['updated_at_start'])
        if filters.get('updated_at_end'):
            qs = qs.filter(updated_at__lte=filters['updated_at_end'])

        return qs.order_by('-updated_at', '-id')


prediction_history_dao = CRUDPredictionHistory(PredictionHistory)
