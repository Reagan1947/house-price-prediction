# 用户登录登出 API 设计

## 1. 设计目标

本文档定义用户登录、登出相关接口的 API 契约，与当前后端实现保持一致：

- API 前缀：`settings.FASTAPI_API_V1_PATH`，当前为 `/api/v1`。
- 认证路由前缀：`/api/v1/auth`（见 `backend/app/admin/api/v1/auth/__init__.py`）。
- 统一响应结构：`{"code": int, "msg": string, "data": any}`（Swagger 调试登录接口除外，见 §4.6）。
- 鉴权请求头：`Authorization: Bearer <access_token>`。
- **登录凭证**：邮箱 + 密码（不再使用用户名登录）。

## 2. 通用约定

### 2.1 请求头

受保护接口需携带：

```http
Authorization: Bearer <access_token>
```

### 2.2 成功响应结构

```json
{
  "code": 200,
  "msg": "Request succeeded",
  "data": {}
}
```

无业务数据时：

```json
{
  "code": 200,
  "msg": "Request succeeded",
  "data": null
}
```

### 2.3 错误响应结构

业务异常与认证异常均返回统一 JSON 结构，`code` 为业务状态码（可与 HTTP 状态码一致）：

```json
{
  "code": 401,
  "msg": "Invalid token",
  "data": null
}
```

参数校验失败时 `code` 为 `422`，`msg` 为字段级错误摘要。

## 3. 接口清单

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/login` | 否 | 用户登录（邮箱 + 密码） |
| `POST` | `/api/v1/auth/logout` | 是 | 用户登出 |
| `POST` | `/api/v1/auth/login/swagger` | 否 | Swagger / OAuth2 调试登录 |
| `GET` | `/api/v1/auth/captcha` | 否 | 获取登录验证码（既有接口，**登录流程不依赖**） |

## 4. 用户登录

### 4.1 基本信息

| 项目 | 内容 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/api/v1/auth/login` |
| Summary | `User login` |
| Content-Type | `application/json` |
| Response | `ResponseSchemaModel[GetLoginToken]` |

### 4.2 请求参数

请求体模型：`AuthLoginParam`（`backend/app/admin/schema/user.py`）。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `email` | string (email) | 是 | 用户注册邮箱 |
| `password` | string | 是 | 登录密码 |

**不包含** `username`、`captcha` 等字段。

请求示例：

```json
{
  "email": "admin@example.com",
  "password": "your-password"
}
```

### 4.3 成功响应

HTTP 状态码：`200`。

```json
{
  "code": 200,
  "msg": "Request succeeded",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "access_token_type": "Bearer",
    "user": {
      "id": 1,
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "username": "admin",
      "email": "admin@example.com",
      "phone": null,
      "avatar": null,
      "status": 1,
      "is_superuser": true,
      "join_time": "2026-01-01 10:00:00",
      "last_login_time": "2026-05-19 14:30:00"
    }
  }
}
```

`data` 字段说明（`GetLoginToken`）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `access_token` | string | JWT，Payload 含 `sub`（用户 ID） |
| `token_type` | string | 固定 `Bearer` |
| `access_token_type` | string | 固定 `Bearer`（仅 `/login` 响应包含） |
| `user` | object | 当前用户详情，结构同 `GetUserInfoDetail` |

`user` 子字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | int | 用户 ID |
| `uuid` | string | 用户 UUID |
| `username` | string | 用户名 |
| `email` | string | 邮箱 |
| `phone` | string \| null | 手机号 |
| `avatar` | string \| null | 头像 URL |
| `status` | int | 账号状态（启用为真值） |
| `is_superuser` | bool | 是否超级管理员 |
| `join_time` | string | 注册时间 |
| `last_login_time` | string \| null | 上次登录时间 |

### 4.4 失败响应

| 场景 | `code` | `msg`（示例） |
| --- | --- | --- |
| 邮箱未注册 | `404` | `Invalid email or password` |
| 密码错误 | `401` | `Invalid email or password` |
| 账号被锁定（`status` 为假） | `401` | `User account is locked, please contact the administrator` |
| 请求体缺少字段 / 邮箱格式非法 | `422` | 参数校验错误信息 |

说明：用户不存在与密码错误对外提示一致，避免泄露账号是否存在。

### 4.5 服务端处理逻辑

1. 校验请求体（`email` 为合法邮箱格式，`password` 非空）。
2. 按 `email` 查询用户（`user_dao.get_by_email`）。
3. 校验密码哈希（`password_verify`）。
4. 校验用户 `status` 已启用。
5. 更新 `last_login_time`。
6. 签发 JWT（`sub` = 用户 ID 字符串）。
7. 返回 `GetLoginToken`（含 Token 与完整用户信息）。

### 4.6 Swagger 调试登录

| 项目 | 内容 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/api/v1/auth/login/swagger` |
| Summary | `swagger 调试专用` |
| Content-Type | `application/x-www-form-urlencoded` |
| 表单模型 | `OAuth2PasswordRequestForm` |
| Response | `GetSwaggerToken`（**直接返回 Token 对象，不包一层 `code/msg/data`**） |

表单字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `username` | 是 | **填写用户邮箱**（OAuth2 标准字段名，语义为邮箱） |
| `password` | 是 | 登录密码 |

`curl` 示例：

```bash
curl -X POST 'http://127.0.0.1:8000/api/v1/auth/login/swagger' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=admin@example.com&password=your-password'
```

成功响应示例（无统一包装）：

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "username": "admin",
    "email": "admin@example.com",
    "phone": null,
    "avatar": null,
    "status": 1,
    "is_superuser": true,
    "join_time": "2026-01-01 10:00:00",
    "last_login_time": "2026-05-19 14:30:00"
  }
}
```

认证逻辑与 `/login` 相同（`user_verify(email, password)`），失败 `msg` 与 §4.4 一致。

OAuth2 文档地址（Swagger Authorize）：`TOKEN_URL_SWAGGER` = `/api/v1/auth/login/swagger`。

## 5. 用户登出

### 5.1 基本信息

| 项目 | 内容 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/api/v1/auth/logout` |
| Summary | `用户登出` |
| 鉴权 | `Authorization: Bearer <token>`（`DependsJwtAuth`） |
| Response | `ResponseModel` |

### 5.2 请求参数

无请求体。

```http
Authorization: Bearer <access_token>
```

### 5.3 成功响应

```json
{
  "code": 200,
  "msg": "Request succeeded",
  "data": null
}
```

### 5.4 失败响应

| 场景 | `code` | `msg`（示例） |
| --- | --- | --- |
| 未携带 Token | `401` | `Not Authenticated` |
| Token 非法 | `401` | `Invalid token` |
| Token 过期 | `401` | `Token expired` |
| 用户不存在 | `401` | `Invalid token` |
| 用户被锁定 | `401` | `User account is locked, please contact the administrator` |

### 5.5 服务端处理逻辑

当前实现通过 `DependsJwtAuth` 校验 Token 与用户状态后返回成功；**服务端无状态 JWT**，登出接口不维护 Redis 黑名单（若后续引入服务端会话，可在此扩展注销逻辑）。

## 6. Schema 设计

### 6.1 登录请求

```python
class AuthLoginParam(SchemaBase):
    email: EmailStr = Field(examples=['user@example.com'], description='邮箱')
    password: str = Field(description='密码')
```

注册仍使用 `AuthSchemaBase`（用户名 + 密码）并额外要求 `email`：

```python
class AuthSchemaBase(SchemaBase):
    username: str = Field(description='用户名')
    password: str = Field(description='密码')


class RegisterUserParam(AuthSchemaBase):
    email: EmailStr = Field(examples=['user@example.com'])
```

### 6.2 登录响应

```python
class GetSwaggerToken(SchemaBase):
    access_token: str
    token_type: str = 'Bearer'
    user: GetUserInfoDetail


class GetLoginToken(GetSwaggerToken):
    access_token_type: str = 'Bearer'
```

`GetUserInfoDetail` 定义见 `backend/app/admin/schema/user.py`。

## 7. 鉴权设计

### 7.1 JWT Payload

当前签发仅包含：

```json
{
  "sub": "1"
}
```

| 字段 | 说明 |
| --- | --- |
| `sub` | 用户 ID（字符串） |

算法与密钥：`settings.TOKEN_ALGORITHM`（`HS256`）、`settings.TOKEN_SECRET_KEY`。

### 7.2 受保护接口认证流程

1. 从 `Authorization: Bearer <token>` 解析 Token。
2. JWT 解码并校验，得到 `sub`（用户 ID）。
3. 按 ID 查询用户；不存在则拒绝。
4. 校验 `status` 启用。

依赖注入：`CurrentUser`、`DependsJwtAuth`（`backend/common/security/jwt.py`）。

## 8. 路由与代码位置

| 内容 | 文件 |
| --- | --- |
| 登录、登出、Swagger 登录 | `backend/app/admin/api/v1/auth/auth.py` |
| 验证码 | `backend/app/admin/api/v1/auth/captcha.py` |
| Auth Service | `backend/app/admin/service/auth_service.py` |
| 用户 CRUD | `backend/app/admin/crud/crud_user.py`（含 `get_by_email`） |
| Token Schema | `backend/app/admin/schema/token.py` |
| User Schema | `backend/app/admin/schema/user.py` |
| JWT 与认证依赖 | `backend/common/security/jwt.py` |

## 9. 兼容性说明

| 项 | 说明 |
| --- | --- |
| 登录方式变更 | `POST /api/v1/auth/login` 由 **用户名 + 密码** 改为 **邮箱 + 密码**；客户端须同步修改请求字段 |
| Swagger 登录 | `username` 表单字段语义改为邮箱，与 JSON 登录一致 |
| 验证码 | `GET /api/v1/auth/captcha` 保留，登录接口不校验 `captcha` |
| 用户注册 | `POST /api/v1/users/register` 仍要求 `username`、`password`、`email`，未变更 |
| 按用户名查用户 | `GET /api/v1/users/{username}` 保留，与登录方式无关 |

## 10. 验收标准

- `POST /api/v1/auth/login` 使用合法 `email`、`password` 时返回 `200`，`data` 含 `access_token`、`token_type`、`access_token_type` 及完整 `user` 对象。
- 邮箱不存在或密码错误时返回 `Invalid email or password`（404 或 401，见 §4.4）。
- 账号锁定时返回 `User account is locked, please contact the administrator`。
- `email` 格式非法或缺少必填字段时返回 `422`。
- `POST /api/v1/auth/login/swagger` 在 `username` 填邮箱、`password` 填密码时可获得 Token。
- `POST /api/v1/auth/logout` 携带有效 Bearer Token 时返回 `200`，`data` 为 `null`。
- 所有使用 `response_base` 的接口响应结构与 `ResponseModel` / `ResponseSchemaModel` 一致。
