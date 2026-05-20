#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from fastapi.security import OAuth2PasswordRequestForm

from backend.app.admin.crud.crud_user import user_dao
from backend.app.admin.model.user import User
from backend.app.admin.schema.token import GetLoginToken
from backend.app.admin.schema.user import AuthLoginParam
from backend.common.exception import errors
from backend.common.security.jwt import create_access_token, password_verify
from backend.utils.timezone import timezone


class AuthService:
    @staticmethod
    async def user_verify(email: str, password: str) -> User:
        user = await user_dao.get_by_email(email)
        if not user:
            raise errors.NotFoundError(msg='Invalid email or password')
        elif not password_verify(password, user.password):
            raise errors.AuthorizationError(msg='Invalid email or password')
        elif not user.status:
            raise errors.AuthorizationError(msg='User account is locked, please contact the administrator')
        return user

    async def swagger_login(self, *, form_data: OAuth2PasswordRequestForm) -> tuple[str, User]:
        # OAuth2 form uses `username` field; pass email here for swagger auth
        user = await self.user_verify(form_data.username, form_data.password)
        await user_dao.update_login_time(user.username, login_time=timezone.now())
        token = create_access_token(str(user.id))
        return token, user

    async def login(self, *, obj: AuthLoginParam) -> GetLoginToken:
        user = await self.user_verify(obj.email, obj.password)
        await user_dao.update_login_time(user.username, login_time=timezone.now())
        token = create_access_token(str(user.id))
        data = GetLoginToken(access_token=token, user=user)
        return data


auth_service: AuthService = AuthService()
