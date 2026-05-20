# 用户登录登出与用户信息功能数据库设计

## 1. 设计目标

本设计支撑用户登录、登出和当前用户信息查询功能。根据详细设计，本次不新增用户注册能力，不新增业务数据库表，复用当前系统已有 `user` 表，并通过 Redis 管理 Token 登录态。

## 2. 存储对象概览

| 类型 | 名称 | 用途 | 是否新增 |
| --- | --- | --- | --- |
| MySQL 表 | `user` | 存储用户账号、密码哈希、邮箱、状态、最后登录时间 | 否 |
| Redis Key | `fba:login:token:{user_id}:{token_digest}` | 存储有效登录 Token，用于登录态校验和登出失效 | 是 |

## 3. MySQL 表设计

### 3.1 `user` 表

对应模型：`backend/app/admin/model/user.py`

本次功能直接复用现有 `user` 表，不需要执行数据库迁移。

| 字段 | 类型 | 约束 | 用途 |
| --- | --- | --- | --- |
| `id` | `BIGINT` | 主键、索引 | 用户唯一 ID，JWT `sub` 和 Redis Token Key 使用 |
| `uuid` | `VARCHAR(36)` | 唯一 | 用户 UUID，当前登录接口不直接返回 |
| `username` | `VARCHAR(32)` | 唯一 | 登录账号，用户信息返回字段 |
| `password` | `VARCHAR(255)` | 非空 | 密码哈希 |
| `salt` | `BINARY` | 非空 | 密码盐 |
| `email` | `VARCHAR(64)` | 唯一 | 用户邮箱，用户信息返回字段 |
| `status` | `SMALLINT` | 默认 `1` | 用户状态，`0` 或非启用状态不允许登录 |
| `is_superuser` | `BOOLEAN` | 默认 `false` | 管理权限标识，本次用户信息接口不返回 |
| `avatar` | `VARCHAR(256)` | 可空 | 头像地址，本次用户信息接口不返回 |
| `phone` | `VARCHAR(16)` | 可空 | 手机号，本次用户信息接口不返回 |
| `join_time` | `DATETIME` | 自动写入 | 用户创建时间 |
| `last_login_time` | `DATETIME` | 可空 | 登录成功时更新 |

### 3.2 索引与唯一约束

沿用现有模型约束：

| 字段 | 约束 | 说明 |
| --- | --- | --- |
| `id` | Primary Key / Index | 按用户 ID 查询当前用户 |
| `uuid` | Unique | 用户 UUID 唯一 |
| `username` | Unique | 登录账号唯一 |
| `email` | Unique | 邮箱唯一 |

本次不新增索引。

### 3.3 数据写入与更新

登录成功后仅更新：

| 字段 | 更新时机 | 来源 |
| --- | --- | --- |
| `last_login_time` | 用户名、密码校验通过后 | `timezone.now()` |

登出不修改 MySQL 数据，只删除 Redis Token Key。

### 3.4 数据读取

| 场景 | 查询条件 | 读取字段 |
| --- | --- | --- |
| 登录用户校验 | `username` | `id`、`username`、`password`、`salt`、`email`、`status` |
| Token 认证 | `id` | `id`、`username`、`email`、`status` |
| 当前用户信息 | 当前认证用户 | `username`、`email` |

## 4. Redis 设计

### 4.1 Token Key

新增配置：

```python
TOKEN_REDIS_PREFIX: str = 'fba:login:token'
```

Key 格式：

```text
fba:login:token:{user_id}:{token_digest}
```

字段说明：

| 片段 | 说明 |
| --- | --- |
| `fba:login:token` | Token 登录态前缀 |
| `{user_id}` | JWT `sub` 中的用户 ID |
| `{token_digest}` | Token 的 SHA-256 摘要 |

设计原因：

- Redis Key 中不直接暴露完整 Token。
- 同一用户可以保留多个 Token，支持多端登录。
- 登出时只删除当前 Token，不影响其他设备。

### 4.2 Token Value

Value 使用 JSON 字符串：

```json
{
  "user_id": 1,
  "username": "admin",
  "login_time": "2026-05-19 10:00:00"
}
```

字段说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `user_id` | int | 用户 ID |
| `username` | string | 用户名，便于排查登录态 |
| `login_time` | string | 登录时间 |

### 4.3 Token TTL

TTL 使用现有配置：

```python
TOKEN_EXPIRE_SECONDS: int = 60 * 60 * 24 * 1
```

默认有效期为 86400 秒。JWT `exp` 与 Redis TTL 使用同一配置，避免出现 JWT 有效但 Redis 已过期或 Redis 有效但 JWT 已过期的时间不一致问题。

### 4.4 Token 写入

登录成功后执行：

```text
SET fba:login:token:{user_id}:{token_digest} {json_value} EX {TOKEN_EXPIRE_SECONDS}
```

写入条件：

- 用户存在。
- 密码校验通过。
- 用户 `status` 为启用。

### 4.5 Token 校验

受保护接口认证时执行：

1. 解析请求头 Bearer Token。
2. 解码 JWT，获取 `sub`。
3. 计算 Token 摘要。
4. 检查 Redis Key 是否存在。
5. Redis Key 存在才认为登录态有效。

Redis Key 不存在时返回 `401`，错误信息建议为 `Token 已失效`。

### 4.6 Token 删除

登出时执行：

```text
DEL fba:login:token:{user_id}:{token_digest}
```

删除成功后，同一 Token 无法继续访问受保护接口。

## 5. 验证码 Redis Key

本需求已移除登录阶段的验证码字段，因此用户登录、登出和当前用户信息功能不再依赖验证码 Redis Key。

当前系统中如仍保留既有验证码接口，其配置和 Key 可继续存在，但不属于本功能的数据依赖：

```python
CAPTCHA_LOGIN_REDIS_PREFIX: str = 'fba:login:captcha'
CAPTCHA_LOGIN_EXPIRE_SECONDS: int = 60 * 5
```

## 6. 数据一致性设计

### 6.1 登录一致性

登录成功需要保证以下动作顺序：

1. 校验用户、密码、状态。
2. 更新 `user.last_login_time`。
3. 生成 JWT。
4. 写入 Redis Token Key。
5. 返回 Token。

如果 Redis 写入失败，不应返回登录成功，否则客户端会得到无法通过认证的 Token。建议让异常向上抛出，由统一异常处理返回服务端错误。

### 6.2 登出一致性

登出只删除 Redis 登录态，不修改 MySQL。删除 Redis Key 成功后，认证依赖会拒绝同一 Token。

### 6.3 Token 过期一致性

JWT `exp` 与 Redis TTL 使用同一个 `TOKEN_EXPIRE_SECONDS` 配置。认证时同时校验 JWT 和 Redis，因此任一侧过期都会导致 Token 失效。

## 7. 容量与清理策略

- Token Key 使用 TTL 自动清理，不需要定时任务。
- 同一用户多端登录会产生多个 Token Key，数量受登录频率和 TTL 控制。
- 如果后续需要强制单用户单 Token，可在登录前删除 `fba:login:token:{user_id}:*` 前缀下旧 Key，但本次设计不启用该策略。

## 8. 安全设计

- 密码继续使用现有哈希和盐存储，不保存明文密码。
- Redis Key 使用 Token 摘要，不保存完整 Token 到 Key。
- Redis Value 不存储密码、邮箱等敏感扩展信息。
- 用户信息接口只读取并返回 `username`、`email`。
- 用户被锁定后，即使 Redis Token 仍存在，认证依赖查询数据库时也会拒绝访问。

## 9. 迁移要求

本次不新增 MySQL 表，不修改 `user` 表字段，不需要生成数据库迁移脚本。

需要增加的配置项：

```python
TOKEN_REDIS_PREFIX: str = 'fba:login:token'
```

## 10. 验收标准

- 登录成功后 Redis 中存在 `fba:login:token:{user_id}:{token_digest}` Key。
- Token Key TTL 等于 `settings.TOKEN_EXPIRE_SECONDS`。
- 调用登出后当前 Token Key 被删除。
- Redis Key 删除后，同一 Token 无法访问受保护接口。
- MySQL `user.last_login_time` 在登录成功后被更新。
- 不产生新的 MySQL 表和字段迁移。
