#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from fastapi import APIRouter

from backend.app.admin.api.router import v1 as admin_v1
from backend.app.prediction.api.router import v1 as prediction_v1

route = APIRouter()

route.include_router(admin_v1)
route.include_router(prediction_v1)
