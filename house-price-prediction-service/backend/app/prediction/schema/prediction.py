#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from pydantic import Field

from backend.common.schema import SchemaBase


class HouseFeatures(SchemaBase):
    square_footage: float = Field(..., description='House square footage')
    bedrooms: float = Field(..., description='Number of bedrooms')
    bathrooms: float = Field(..., description='Number of bathrooms')
    year_built: int = Field(..., description='Year built')
    lot_size: float = Field(..., description='Lot size')
    distance_to_city_center: float = Field(..., description='Distance to city center')
    school_rating: float = Field(..., description='Nearby school rating')

