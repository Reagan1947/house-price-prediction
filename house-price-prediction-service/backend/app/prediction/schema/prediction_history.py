#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from datetime import datetime

from pydantic import ConfigDict, Field

from backend.common.schema import SchemaBase


class PredictionFeaturesParam(SchemaBase):
    title: str | None = Field(default=None, max_length=128, description='标题')
    location: str | None = Field(default=None, max_length=256, description='房产位置')
    square_footage: float = Field(..., description='建筑面积')
    bedrooms: float = Field(..., description='卧室数')
    bathrooms: float = Field(..., description='卫生间数')
    year_built: int = Field(..., description='建成年份')
    lot_size: float = Field(..., description='占地面积')
    distance_to_city_center: float = Field(..., description='距市中心距离')
    school_rating: float = Field(..., description='学区评分')


class CreatePredictionHistoryParam(PredictionFeaturesParam):
    predicted_price: float | None = Field(default=None, description='预测结果（可选）')


class UpdatePredictionHistoryParam(PredictionFeaturesParam):
    predicted_price: float | None = Field(default=None, description='预测结果（可显式置空）')


class PredictionHistoryDetail(SchemaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(description='预测实例 ID')
    title: str | None = Field(default=None, description='标题')
    location: str | None = Field(default=None, description='房产位置')
    square_footage: float
    bedrooms: float
    bathrooms: float
    year_built: int
    lot_size: float
    distance_to_city_center: float
    school_rating: float
    predicted_price: float | None = Field(default=None, description='预测结果')
    predicted_at: datetime | None = Field(default=None, description='预测时间')
    created_at: datetime = Field(description='创建时间')
    updated_at: datetime = Field(description='更新时间')


class PredictionHistoryListItem(PredictionHistoryDetail):
    """列表项与详情字段一致；保留两个名字以便后续按需差异化。"""
