#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from tortoise.queryset import QuerySet
from backend.app.admin.crud.crud_user import user_dao
from backend.app.admin.model.user import User
from backend.app.admin.schema.user import RegisterUserParam, ResetPassword, UpdateUserParam, AvatarParam
from backend.common.exception import errors
from backend.common.security.jwt import get_hash_password, password_verify, superuser_verify


class UserService:
    @staticmethod
    async def register(*, obj: RegisterUserParam) -> None:
        if not obj.password:
            raise errors.ForbiddenError(msg='Password is required')
        username = await user_dao.get_by_username(name=obj.username)
        if username:
            raise errors.ForbiddenError(msg='Username already registered')
        email = await user_dao.check_email(obj.email)
        if email:
            raise errors.ForbiddenError(msg='Email already registered')
        await user_dao.register(obj)

    @staticmethod
    async def pwd_reset(*, obj: ResetPassword) -> int:
        user = await user_dao.get_by_username(obj.username)
        if not password_verify(obj.old_password, user.password):
            raise errors.ForbiddenError(msg='Incorrect current password')
        np1 = obj.new_password
        np2 = obj.confirm_password
        if np1 != np2:
            raise errors.ForbiddenError(msg='Passwords do not match')
        new_pwd = get_hash_password(obj.new_password, user.salt)
        count = await user_dao.reset_password(user.id, new_pwd)
        return count

    @staticmethod
    async def get_userinfo(*, username: str) -> User:
        user = await user_dao.get_by_username(username)
        if not user:
            raise errors.NotFoundError(msg='User not found')
        return user

    @staticmethod
    async def update(*, username: str, obj: UpdateUserParam) -> int:
        input_user = await user_dao.get_by_username(username)
        if not input_user:
            raise errors.NotFoundError(msg='User not found')
        superuser_verify(input_user)
        if input_user.username != obj.username:
            _username = await user_dao.get_by_username(obj.username)
            if _username:
                raise errors.ForbiddenError(msg='Username already registered')
        if input_user.email != obj.email:
            email = await user_dao.check_email(obj.email)
            if email:
                raise errors.ForbiddenError(msg='Email already registered')
        count = await user_dao.update_userinfo(input_user.id, obj)
        return count

    @staticmethod
    async def update_avatar(*, username: str, avatar: AvatarParam) -> int:
        input_user = await user_dao.get_by_username(username)
        if not input_user:
            raise errors.NotFoundError(msg='User not found')
        count = await user_dao.update_avatar(input_user.id, avatar)
        return count

    @staticmethod
    async def get_list(*, username: str = None, phone: str = None, status: int = None) -> QuerySet:
        return await user_dao.get_list(username=username, phone=phone, status=status)

    @staticmethod
    async def delete(*, username: str, current_user: User) -> int:
        superuser_verify(current_user)
        input_user = await user_dao.get_by_username(username)
        if not input_user:
            raise errors.NotFoundError(msg='User not found')
        count = await user_dao.delete(input_user.id)
        return count
