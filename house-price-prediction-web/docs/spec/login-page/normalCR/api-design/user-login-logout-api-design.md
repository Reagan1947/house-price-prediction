# 用户登录登出与用户信息功能 API 设计

## 1. 设计目标

本文档定义用户登录、登出和当前用户信息查询功能的 API 契约。接口设计遵循当前系统 FastAPI 风格：

- API 前缀使用 `settings.FASTAPI_API_V1_PATH`，当前为 `/api/v1`。
- 认证接口位于 `/api/v1/auth`。
- 用户接口位于 `/api/v1/users`。
- 统一响应结构为 `{"code": int, "msg": string, "data": any}`。
- 鉴权使用 `Authorization: Bearer <token>`。

## 2. 通用约定

### 2.1 请求头

受保护接口需要携带：

```http
Authorization: Bearer <access_token>
```

### 2.2 成功响应结构

```json
{
  "code": 200,
  "msg": "请求成功",
  "data": {}
}
```

无业务数据时：

```json
{
  "code": 200,
  "msg": "请求成功",
  "data": null
}
```

### 2.3 错误响应结构

沿用系统统一异常处理，业务错误和认证错误保持当前项目风格：

```json
{
  "code": 401,
  "msg": "Token 无效",
  "data": null
}
```

## 3. 接口清单

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/login` | 否 | 用户登录 |
| `POST` | `/api/v1/auth/logout` | 是 | 用户登出 |
| `GET` | `/api/v1/users/me` | 是 | 获取当前用户信息 |

相关既有接口：

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| `GET` | `/api/v1/auth/captcha` | 否 | 既有验证码接口，本需求登录流程不再依赖 |
| `POST` | `/api/v1/auth/login/swagger` | 否 | Swagger 调试登录 |
| `GET` | `/api/v1/users/{username}` | 是 | 按用户名查询用户详情，保留兼容 |

## 4. 用户登录

### 4.1 基本信息

| 项目 | 内容 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/api/v1/auth/login` |
| Summary | `用户登录` |
| Request Body | `application/json` |
| Response | `ResponseSchemaModel[GetLoginToken]` |

### 4.2 请求参数

请求体使用用户名和密码，不再包含验证码字段。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `username` | string | 是 | 用户名 |
| `password` | string | 是 | 密码 |

示例：

```json
{
  "username": "admin",
  "password": "password"
}
```

### 4.3 成功响应

```json
{
  "code": 200,
  "msg": "请求成功",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "user": {
      "username": "admin",
      "email": "admin@example.com"
    }
  }
}
```

响应字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `data.access_token` | string | JWT Token |
| `data.token_type` | string | 固定为 `Bearer` |
| `data.expires_in` | int | Token 有效期，单位秒 |
| `data.user.username` | string | 用户名 |
| `data.user.email` | string | 用户邮箱 |

### 4.4 失败响应

| 场景 | HTTP 状态/业务码 | `msg` |
| --- | --- | --- |
| 用户不存在 | `401` | `用户名或密码有误` |
| 密码错误 | `401` | `用户名或密码有误` |
| 用户被锁定 | `401` | `用户已被锁定, 请联系统管理员` |

### 4.5 服务端处理逻辑

1. 根据 `username` 查询用户。
2. 校验密码哈希。
3. 校验用户 `status`。
4. 更新用户 `last_login_time`。
5. 生成包含 `sub`、`iat`、`exp` 的 JWT。
6. 写入 Redis Token Key，并设置 TTL。
7. 返回 Token 和轻量用户信息。

## 5. 用户登出

### 5.1 基本信息

| 项目 | 内容 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/api/v1/auth/logout` |
| Summary | `用户登出` |
| 鉴权 | `Authorization: Bearer <token>` |
| Response | `ResponseModel` |

### 5.2 请求参数

无请求体。

请求头：

```http
Authorization: Bearer <access_token>
```

### 5.3 成功响应

```json
{
  "code": 200,
  "msg": "请求成功",
  "data": null
}
```

### 5.4 失败响应

| 场景 | HTTP 状态/业务码 | `msg` |
| --- | --- | --- |
| 未携带 Token | `401` | `Not Authenticated` 或 `Token 无效` |
| Token 格式非法 | `401` | `Token 无效` |
| Token 已过期 | `401` | `Token 已过期` |
| Redis 登录态不存在 | `401` | `Token 已失效` |
| 用户不存在 | `401` | `Token 无效` |
| 用户被锁定 | `401` | `用户已被锁定，请联系系统管理员` |

### 5.5 服务端处理逻辑

1. 从 `Authorization` 请求头解析 Bearer Token。
2. 解码 JWT 并校验签名、`exp`、`sub`。
3. 校验 Redis Token Key 存在。
4. 校验数据库用户存在且启用。
5. 删除当前 Token 对应 Redis Key。
6. 返回成功。

## 6. 当前用户信息

### 6.1 基本信息

| 项目 | 内容 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/api/v1/users/me` |
| Summary | `获取当前用户信息` |
| 鉴权 | `Authorization: Bearer <token>` |
| Response | `ResponseSchemaModel[GetCurrentUserInfo]` |

### 6.2 请求参数

无 Query 参数，无请求体。

请求头：

```http
Authorization: Bearer <access_token>
```

### 6.3 成功响应

```json
{
  "code": 200,
  "msg": "请求成功",
  "data": {
    "username": "admin",
    "email": "admin@example.com"
  }
}
```

响应字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `data.username` | string | 用户名 |
| `data.email` | string | 用户邮箱 |

### 6.4 失败响应

| 场景 | HTTP 状态/业务码 | `msg` |
| --- | --- | --- |
| 未携带 Token | `401` | `Not Authenticated` 或 `Token 无效` |
| Token 格式非法 | `401` | `Token 无效` |
| Token 已过期 | `401` | `Token 已过期` |
| Redis 登录态不存在 | `401` | `Token 已失效` |
| 用户不存在 | `401` | `Token 无效` |
| 用户被锁定 | `401` | `用户已被锁定，请联系系统管理员` |

### 6.5 服务端处理逻辑

1. 通过 `DependsJwtAuth` / `CurrentUser` 完成认证。
2. 使用认证依赖返回的当前用户对象。
3. 返回 `username` 和 `email`。

注意：`/api/v1/users/me` 必须定义在 `/api/v1/users/{username}` 之前，避免 `me` 被路由解析为用户名。

## 7. Schema 设计

### 7.1 请求 Schema

登录请求 Schema 可直接复用或继承 `AuthSchemaBase`，不再扩展 `captcha` 字段：

```python
class AuthSchemaBase(SchemaBase):
    username: str = Field(description='用户名')
    password: str = Field(description='密码')
```

```python
class AuthLoginParam(AuthSchemaBase):
    pass
```

### 7.2 响应 Schema

建议新增轻量用户信息 Schema：

```python
class GetLoginUserInfo(SchemaBase):
    username: str = Field(description='用户名')
    email: EmailStr = Field(description='邮箱')
```

登录响应：

```python
class GetLoginToken(SchemaBase):
    access_token: str
    token_type: str = 'Bearer'
    expires_in: int
    user: GetLoginUserInfo
```

当前用户信息响应：

```python
class GetCurrentUserInfo(SchemaBase):
    model_config = ConfigDict(from_attributes=True)

    username: str = Field(description='用户名')
    email: EmailStr = Field(description='邮箱')
```

## 8. 鉴权设计

### 8.1 JWT Payload

JWT Payload 建议包含：

```json
{
  "sub": "1",
  "iat": 1779165600,
  "exp": 1779252000
}
```

字段说明：

| 字段 | 说明 |
| --- | --- |
| `sub` | 用户 ID |
| `iat` | Token 签发时间 |
| `exp` | Token 过期时间 |

### 8.2 认证判定

Token 必须同时满足：

- JWT 签名有效。
- JWT 未过期。
- JWT `sub` 能解析为有效用户 ID。
- Redis 中存在当前 Token 对应 Key。
- 数据库用户存在且 `status` 启用。

任一条件不满足则拒绝访问。

## 9. 路由与代码位置

| 内容 | 文件 |
| --- | --- |
| 登录、登出接口 | `backend/app/admin/api/v1/auth/auth.py` |
| 验证码接口 | `backend/app/admin/api/v1/auth/captcha.py`，本需求登录流程不依赖 |
| 当前用户信息接口 | `backend/app/admin/api/v1/user.py` |
| Auth Service | `backend/app/admin/service/auth_service.py` |
| User Service | `backend/app/admin/service/user_service.py` |
| Token Schema | `backend/app/admin/schema/token.py` |
| User Schema | `backend/app/admin/schema/user.py` |
| JWT 与认证依赖 | `backend/common/security/jwt.py` |
| Redis 客户端 | `backend/database/redis.py` |

## 10. 兼容性设计

- 保留 `/api/v1/auth/login/swagger`，并使其签发的 Token 同样写入 Redis，保证 Swagger 调试 Token 可访问受保护接口。
- 保留 `/api/v1/users/{username}`，不改变后台按用户名查询用户详情能力。
- 不新增 `/register` 能力；已有 `/api/v1/users/register` 是否继续存在由系统现状决定，本需求不扩展注册流程。
- 登录响应建议统一使用 `token_type`，不再新增或依赖 `access_token_type`。
- 登录请求体移除 `captcha` 字段；既有 `/api/v1/auth/captcha` 接口是否继续保留取决于其他调用方，本需求不要求删除。

## 11. 验收标准

- `POST /api/v1/auth/login` 登录成功返回 `access_token`、`token_type`、`expires_in`、`user.username`、`user.email`。
- 登录失败时按错误场景返回对应错误信息。
- `GET /api/v1/users/me` 携带有效 Token 时返回当前用户用户名和邮箱。
- `POST /api/v1/auth/logout` 携带有效 Token 时删除 Redis 登录态并返回成功。
- 登出后同一 Token 再访问 `/api/v1/users/me` 返回 `401`。
- 所有接口响应结构与当前系统统一响应模型一致。
