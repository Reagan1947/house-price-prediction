#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from tortoise import Model, fields


class PredictionHistory(Model):
    """房价预测历史记录"""

    id = fields.BigIntField(pk=True, index=True, description='主键')
    user_id = fields.BigIntField(index=True, description='归属用户 ID')

    title = fields.CharField(max_length=128, null=True, description='标题')
    location = fields.CharField(max_length=256, null=True, description='房产位置')

    square_footage = fields.DecimalField(max_digits=12, decimal_places=2, description='建筑面积')
    bedrooms = fields.DecimalField(max_digits=5, decimal_places=2, description='卧室数')
    bathrooms = fields.DecimalField(max_digits=5, decimal_places=2, description='卫生间数')
    year_built = fields.IntField(description='建成年份')
    lot_size = fields.DecimalField(max_digits=12, decimal_places=2, description='占地面积')
    distance_to_city_center = fields.DecimalField(max_digits=10, decimal_places=2, description='距市中心距离')
    school_rating = fields.DecimalField(max_digits=5, decimal_places=2, description='学区评分')

    predicted_price = fields.DecimalField(
        max_digits=18, decimal_places=2, null=True, description='预测结果'
    )
    predicted_at = fields.DatetimeField(null=True, description='预测时间')

    is_deleted = fields.BooleanField(default=False, index=True, description='逻辑删除')
    deleted_at = fields.DatetimeField(null=True, description='逻辑删除时间')

    created_at = fields.DatetimeField(auto_now_add=True, description='创建时间')
    updated_at = fields.DatetimeField(auto_now=True, description='更新时间')

    class Meta:
        table = 'prediction_history'
        indexes = (
            ('user_id', 'is_deleted', 'updated_at'),
            ('user_id', 'is_deleted', 'created_at'),
        )
