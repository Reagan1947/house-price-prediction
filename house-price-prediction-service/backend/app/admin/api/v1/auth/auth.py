#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm

from backend.app.admin.schema.token import GetLoginToken, GetSwaggerToken, VerifyTokenResult
from backend.app.admin.schema.user import AuthLoginParam
from backend.app.admin.service.auth_service import auth_service
from backend.common.response.response_schema import ResponseModel, ResponseSchemaModel, response_base
from backend.common.security.jwt import CurrentUser, DependsJwtAuth

router = APIRouter()


@router.post(
    '/login/swagger',
    summary='swagger 调试专用',
    description='用于快捷进行 swagger 认证；username 字段填写邮箱，password 填写密码',
)
async def swagger_login(form_data: OAuth2PasswordRequestForm = Depends()) -> GetSwaggerToken:
    token, user = await auth_service.swagger_login(form_data=form_data)
    return GetSwaggerToken(access_token=token, user=user)  # type: ignore


@router.post('/login', summary='User login')
async def user_login(obj: AuthLoginParam) -> ResponseSchemaModel[GetLoginToken]:
    data = await auth_service.login(obj=obj)
    return response_base.success(data=data)


@router.post('/logout', summary='用户登出', dependencies=[DependsJwtAuth])
async def user_logout() -> ResponseModel:
    return response_base.success()


@router.get('/verify', summary='Token 校验', dependencies=[DependsJwtAuth])
async def verify_token(current_user: CurrentUser) -> ResponseSchemaModel[VerifyTokenResult]:
    data = VerifyTokenResult(
        valid=True,
        user_id=current_user.id,
        username=current_user.username,
        email=current_user.email,
    )
    return response_base.success(data=data)
