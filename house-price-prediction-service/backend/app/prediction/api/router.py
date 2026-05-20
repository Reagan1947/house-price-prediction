#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from fastapi import APIRouter

from backend.app.prediction.api.v1.prediction import router as prediction_router
from backend.app.prediction.api.v1.prediction_history import router as prediction_history_router
from backend.core.conf import settings

v1 = APIRouter(prefix=settings.FASTAPI_API_V1_PATH)
v1.include_router(prediction_router)
v1.include_router(prediction_history_router, prefix='/predictions')

