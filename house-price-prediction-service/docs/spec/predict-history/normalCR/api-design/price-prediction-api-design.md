# 房价预测与预测历史 API 设计

## 1. 设计目标

本文档定义房价预测、预测历史相关接口的 API 契约，与 `docs/spec/predict-history/normalCR/detail-design/price-prediction-detail-design.md` 保持一致：

- API 前缀：`settings.FASTAPI_API_V1_PATH`，当前为 `/api/v1`。
- 预测历史路由前缀：`/api/v1/predictions`（见 `backend/app/prediction/api/router.py`）。
- 统一响应结构：`{"code": int, "msg": string, "data": any}`。
- 鉴权请求头：`Authorization: Bearer <access_token>`（仅预测历史接口需要）。
- 既有 `/api/v1/predict`、`/model-info`、`/health` 契约保持不变。

## 2. 通用约定

### 2.1 请求头

预测历史接口（`/api/v1/predictions/*`）需携带：

```http
Authorization: Bearer <access_token>
```

`/api/v1/predict`、`/api/v1/model-info`、`/api/v1/health` 按现状，不强制鉴权。

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

### 2.4 时间格式

`datetime` 字段在响应中统一序列化为 `YYYY-MM-DD HH:MM:SS`（`settings.DATETIME_FORMAT`）。

## 3. 接口清单

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/predict` | 否 | 房价预测（单笔与批次，不落库） |
| `GET` | `/api/v1/model-info` | 否 | 模型信息与效能指标 |
| `GET` | `/api/v1/health` | 否 | 模型健康检查 |
| `POST` | `/api/v1/predictions` | 是 | 创建房价预测实例 |
| `GET` | `/api/v1/predictions` | 是 | 分页查询当前用户预测历史 |
| `GET` | `/api/v1/predictions/{id}` | 是 | 查看预测实例详情 |
| `PUT` | `/api/v1/predictions/{id}` | 是 | 编辑预测实例 |
| `POST` | `/api/v1/predictions/{id}/predict` | 是 | 对实例当前特征再次预测并回写 |
| `DELETE` | `/api/v1/predictions/{id}` | 是 | 逻辑删除预测实例 |

## 4. 房价预测（既有接口）

### 4.1 基本信息

| 项目 | 内容 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/api/v1/predict` |
| Summary | `房价预测（支持单笔与批次）` |
| Content-Type | `application/json` |
| Response | `ResponseModel` |

### 4.2 请求参数

请求体为 `HouseFeatures`（单笔）或 `HouseFeatures[]`（批次）。

`HouseFeatures`（`backend/app/prediction/schema/prediction.py`）：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `square_footage` | float | 是 | 建筑面积 |
| `bedrooms` | float | 是 | 卧室数 |
| `bathrooms` | float | 是 | 卫生间数 |
| `year_built` | int | 是 | 建成年份 |
| `lot_size` | float | 是 | 占地面积 |
| `distance_to_city_center` | float | 是 | 距市中心距离 |
| `school_rating` | float | 是 | 学区评分 |

单笔请求示例：

```json
{
  "square_footage": 120.0,
  "bedrooms": 3.0,
  "bathrooms": 2.0,
  "year_built": 2015,
  "lot_size": 300.0,
  "distance_to_city_center": 8.5,
  "school_rating": 8.0
}
```

批次请求示例：

```json
[
  {
    "square_footage": 120.0,
    "bedrooms": 3.0,
    "bathrooms": 2.0,
    "year_built": 2015,
    "lot_size": 300.0,
    "distance_to_city_center": 8.5,
    "school_rating": 8.0
  },
  {
    "square_footage": 90.0,
    "bedrooms": 2.0,
    "bathrooms": 1.0,
    "year_built": 2010,
    "lot_size": 200.0,
    "distance_to_city_center": 12.0,
    "school_rating": 7.5
  }
]
```

### 4.3 成功响应

#### 单笔模式

HTTP 状态码：`200`。

```json
{
  "code": 200,
  "msg": "Request succeeded",
  "data": {
    "mode": "single",
    "count": 1,
    "prediction": 5320000.0,
    "predictions": [5320000.0]
  }
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `mode` | string | 固定 `single` |
| `count` | int | 预测条数，固定 `1` |
| `prediction` | float | 首条预测结果 |
| `predictions` | float[] | 预测结果数组 |

#### 批次模式

```json
{
  "code": 200,
  "msg": "Request succeeded",
  "data": {
    "mode": "batch",
    "count": 2,
    "predictions": [5320000.0, 4100000.0]
  }
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `mode` | string | 固定 `batch` |
| `count` | int | 预测条数 |
| `predictions` | float[] | 预测结果数组，顺序与请求体一致 |

### 4.4 失败响应

| 场景 | `code` | `msg`（示例） |
| --- | --- | --- |
| 请求体为空数组 | `400` | `Input payload is empty` |
| 缺少模型特征列 | `400` | `Missing required feature columns: [...]` |
| 模型工件缺失 | `500` | `Model artifacts not found: [...]` |
| 请求体缺少字段 / 类型非法 | `422` | 参数校验错误信息 |

### 4.5 服务端处理逻辑

1. 判断请求体为单笔或批次。
2. 将 `HouseFeatures` 转为 `dict` 列表。
3. 调用 `PredictionService.predict(rows)` 加载模型并推理。
4. 按模式组装 `data` 返回。

本接口**不落库**，不关联当前登录用户。

## 5. 模型信息（既有接口）

### 5.1 基本信息

| 项目 | 内容 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/api/v1/model-info` |
| Summary | `模型信息与效能指标` |
| Response | `ResponseModel` |

### 5.2 成功响应（节选）

```json
{
  "code": 200,
  "msg": "Request succeeded",
  "data": {
    "model_name": "LinearRegression",
    "model_path": "/path/to/model.joblib",
    "trained_at_utc": "2026-01-01T00:00:00Z",
    "selected_model": "linear_regression",
    "feature_columns": [
      "square_footage",
      "bedrooms",
      "bathrooms",
      "year_built",
      "lot_size",
      "distance_to_city_center",
      "school_rating"
    ],
    "intercept": 12345.67,
    "coefficients": [
      { "feature": "square_footage", "coefficient": 100.0 }
    ],
    "metrics": {
      "rmse": 50000.0,
      "r2": 0.85
    }
  }
}
```

## 6. 模型健康检查（既有接口）

### 6.1 基本信息

| 项目 | 内容 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/api/v1/health` |
| Summary | `模型健康检查` |
| Response | `ResponseModel` |

### 6.2 成功响应

```json
{
  "code": 200,
  "msg": "Request succeeded",
  "data": {
    "status": "ok",
    "artifacts": {
      "model": true,
      "metrics": true,
      "metadata": true
    },
    "artifacts_dir": "/path/to/model-artifacts"
  }
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `status` | string | `ok` 或 `degraded` |
| `artifacts` | object | 各工件文件是否存在 |
| `artifacts_dir` | string | 模型工件目录绝对路径 |

## 7. 创建房价预测实例

### 7.1 基本信息

| 项目 | 内容 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/api/v1/predictions` |
| Summary | `创建房价预测实例` |
| Content-Type | `application/json` |
| 鉴权 | `Authorization: Bearer <token>`（`DependsJwtAuth`） |
| Response | `ResponseSchemaModel[PredictionHistoryDetail]` |

### 7.2 请求参数

请求体模型：`CreatePredictionHistoryParam`（`backend/app/prediction/schema/prediction_history.py`）。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `title` | string \| null | 否 | 实例标题，最长 128 字符 |
| `location` | string \| null | 否 | 房产位置文本，最长 256 字符 |
| `square_footage` | float | 是 | 建筑面积 |
| `bedrooms` | float | 是 | 卧室数 |
| `bathrooms` | float | 是 | 卫生间数 |
| `year_built` | int | 是 | 建成年份 |
| `lot_size` | float | 是 | 占地面积 |
| `distance_to_city_center` | float | 是 | 距市中心距离 |
| `school_rating` | float | 是 | 学区评分 |
| `predicted_price` | float \| null | 否 | 预测结果；为空表示仅保存、未预测 |

请求示例（先预测、再保存）：

```json
{
  "title": "Test house",
  "location": "Shanghai Pudong",
  "square_footage": 120.0,
  "bedrooms": 3.0,
  "bathrooms": 2.0,
  "year_built": 2015,
  "lot_size": 300.0,
  "distance_to_city_center": 8.5,
  "school_rating": 8.0,
  "predicted_price": 5320000.0
}
```

请求示例（只保存、不预测）：

```json
{
  "title": "Draft",
  "location": null,
  "square_footage": 120.0,
  "bedrooms": 3.0,
  "bathrooms": 2.0,
  "year_built": 2015,
  "lot_size": 300.0,
  "distance_to_city_center": 8.5,
  "school_rating": 8.0,
  "predicted_price": null
}
```

### 7.3 成功响应

HTTP 状态码：`200`。

```json
{
  "code": 200,
  "msg": "Request succeeded",
  "data": {
    "id": 12,
    "title": "Test house",
    "location": "Shanghai Pudong",
    "square_footage": 120.0,
    "bedrooms": 3.0,
    "bathrooms": 2.0,
    "year_built": 2015,
    "lot_size": 300.0,
    "distance_to_city_center": 8.5,
    "school_rating": 8.0,
    "predicted_price": 5320000.0,
    "predicted_at": "2026-05-19 10:20:00",
    "created_at": "2026-05-19 10:20:00",
    "updated_at": "2026-05-19 10:20:00"
  }
}
```

`data` 字段说明（`PredictionHistoryDetail`）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | int | 预测实例 ID |
| `title` | string \| null | 标题 |
| `location` | string \| null | 房产位置 |
| `square_footage` | float | 建筑面积 |
| `bedrooms` | float | 卧室数 |
| `bathrooms` | float | 卫生间数 |
| `year_built` | int | 建成年份 |
| `lot_size` | float | 占地面积 |
| `distance_to_city_center` | float | 距市中心距离 |
| `school_rating` | float | 学区评分 |
| `predicted_price` | float \| null | 预测结果；未预测时为 `null` |
| `predicted_at` | string \| null | 预测时间；未预测时为 `null` |
| `created_at` | string | 创建时间 |
| `updated_at` | string | 更新时间 |

响应中**不返回** `user_id`、`is_deleted`、`deleted_at` 等内部字段。

### 7.4 失败响应

| 场景 | `code` | `msg`（示例） |
| --- | --- | --- |
| 未携带 Token | `401` | `Not Authenticated` |
| Token 非法 / 过期 | `401` | `Invalid token` / `Token expired` |
| 用户被锁定 | `401` | `User account is locked, please contact the administrator` |
| 请求体缺少字段 / 类型非法 | `422` | 参数校验错误信息 |
| `title` / `location` 超长 | `422` | 参数校验错误信息 |

### 7.5 服务端处理逻辑

1. 通过 `DependsJwtAuth` 获取 `current_user`。
2. 校验请求体。
3. 若 `predicted_price` 非空，设置 `predicted_at = timezone.now()`；否则 `predicted_at = null`。
4. 写入 `prediction_history` 表，`user_id = current_user.id`。
5. 返回 `PredictionHistoryDetail`。

产品流程说明：

- **先预测、再保存**：客户端先调用 `POST /api/v1/predict` 获取 `predicted_price`，再调用本接口回传。
- **只保存**：`predicted_price` 传 `null`，服务端不触发推理。

## 8. 分页查询预测历史

### 8.1 基本信息

| 项目 | 内容 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/api/v1/predictions` |
| Summary | `分页查询当前用户房价预测历史` |
| 鉴权 | `Authorization: Bearer <token>`（`DependsJwtAuth` + `DependsPagination`） |
| Response | `ResponseSchemaModel[PageData[PredictionHistoryListItem]]` |

### 8.2 查询参数

#### 分页参数

| 参数 | 类型 | 默认 | 约束 | 说明 |
| --- | --- | --- | --- | --- |
| `page` | int | `1` | ≥ 1 | 页码 |
| `size` | int | `20` | 1–100 | 每页条数 |

#### 搜索参数（全部可选）

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `keyword` | string | 在 `title`、`location` 上模糊匹配（OR） |
| `title` | string | 标题模糊匹配 |
| `location` | string | 位置模糊匹配 |
| `square_footage_min` | float | 建筑面积下限（含） |
| `square_footage_max` | float | 建筑面积上限（含） |
| `bedrooms_min` | float | 卧室数下限（含） |
| `bedrooms_max` | float | 卧室数上限（含） |
| `bathrooms_min` | float | 卫生间数下限（含） |
| `bathrooms_max` | float | 卫生间数上限（含） |
| `year_built_min` | int | 建成年份下限（含） |
| `year_built_max` | int | 建成年份上限（含） |
| `lot_size_min` | float | 占地面积下限（含） |
| `lot_size_max` | float | 占地面积上限（含） |
| `distance_min` | float | 距市中心距离下限（含） |
| `distance_max` | float | 距市中心距离上限（含） |
| `school_rating_min` | float | 学区评分下限（含） |
| `school_rating_max` | float | 学区评分上限（含） |
| `predicted_price_min` | float | 预测结果下限（含） |
| `predicted_price_max` | float | 预测结果上限（含） |
| `has_prediction` | bool | `true` 仅已预测；`false` 仅未预测 |
| `created_at_start` | datetime | 创建时间下限（含），格式 `YYYY-MM-DD HH:MM:SS` |
| `created_at_end` | datetime | 创建时间上限（含） |
| `updated_at_start` | datetime | 更新时间下限（含） |
| `updated_at_end` | datetime | 更新时间上限（含） |

请求示例：

```http
GET /api/v1/predictions?page=1&size=20&keyword=Shanghai&square_footage_min=100&has_prediction=true
Authorization: Bearer <access_token>
```

### 8.3 成功响应

HTTP 状态码：`200`。

```json
{
  "code": 200,
  "msg": "Request succeeded",
  "data": {
    "items": [
      {
        "id": 12,
        "title": "Test house",
        "location": "Shanghai Pudong",
        "square_footage": 120.0,
        "bedrooms": 3.0,
        "bathrooms": 2.0,
        "year_built": 2015,
        "lot_size": 300.0,
        "distance_to_city_center": 8.5,
        "school_rating": 8.0,
        "predicted_price": 5320000.0,
        "predicted_at": "2026-05-19 10:20:00",
        "created_at": "2026-05-19 10:20:00",
        "updated_at": "2026-05-19 10:20:00"
      }
    ],
    "total": 1,
    "page": 1,
    "size": 20,
    "total_pages": 1,
    "links": {
      "first": "/api/v1/predictions?page=1&size=20",
      "last": "/api/v1/predictions?page=1&size=20",
      "self": "/api/v1/predictions?page=1&size=20",
      "next": null,
      "prev": null
    }
  }
}
```

`data` 分页字段说明（`PageData[PredictionHistoryListItem]`）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `items` | array | 当前页数据，`PredictionHistoryListItem` 与 `PredictionHistoryDetail` 字段一致 |
| `total` | int | 总条数 |
| `page` | int | 当前页码 |
| `size` | int | 每页条数 |
| `total_pages` | int | 总页数 |
| `links` | object | 分页导航链接 |

### 8.4 失败响应

| 场景 | `code` | `msg`（示例） |
| --- | --- | --- |
| 未携带 Token | `401` | `Not Authenticated` |
| Token 非法 / 过期 | `401` | `Invalid token` / `Token expired` |
| `page` / `size` 非法 | `422` | 参数校验错误信息 |

### 8.5 服务端处理逻辑

1. 通过 `DependsJwtAuth` 获取 `current_user`。
2. 组装搜索条件，强制附加 `user_id = current_user.id AND is_deleted = false`。
3. 按 `updated_at DESC, id DESC` 排序。
4. 调用 `paging_data(queryset)` 返回分页结果。

## 9. 查看预测实例详情

### 9.1 基本信息

| 项目 | 内容 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/api/v1/predictions/{id}` |
| Summary | `查看房价预测实例详情` |
| 鉴权 | `Authorization: Bearer <token>`（`DependsJwtAuth`） |
| Response | `ResponseSchemaModel[PredictionHistoryDetail]` |

### 9.2 路径参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `id` | int | 预测实例 ID |

### 9.3 成功响应

结构与 §7.3 的 `PredictionHistoryDetail` 相同。

### 9.4 失败响应

| 场景 | `code` | `msg`（示例） |
| --- | --- | --- |
| 未携带 Token | `401` | `Not Authenticated` |
| Token 非法 / 过期 | `401` | `Invalid token` / `Token expired` |
| 实例不存在 / 不属于当前用户 / 已逻辑删除 | `404` | `Prediction history not found` |

说明：跨用户访问与记录不存在对外统一返回 `404`，避免泄露 ID 是否存在。

### 9.5 服务端处理逻辑

1. 按 `id` + `user_id = current_user.id` + `is_deleted = false` 查询。
2. 存在则返回详情；否则抛 `NotFoundError`。

## 10. 编辑预测实例

### 10.1 基本信息

| 项目 | 内容 |
| --- | --- |
| 方法 | `PUT` |
| 路径 | `/api/v1/predictions/{id}` |
| Summary | `编辑房价预测实例` |
| Content-Type | `application/json` |
| 鉴权 | `Authorization: Bearer <token>`（`DependsJwtAuth`） |
| Response | `ResponseSchemaModel[PredictionHistoryDetail]` |

### 10.2 路径参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `id` | int | 预测实例 ID |

### 10.3 请求参数

请求体模型：`UpdatePredictionHistoryParam`，字段与 `CreatePredictionHistoryParam` 相同，语义为**整体覆盖**。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `title` | string \| null | 否 | 实例标题 |
| `location` | string \| null | 否 | 房产位置 |
| `square_footage` | float | 是 | 建筑面积 |
| `bedrooms` | float | 是 | 卧室数 |
| `bathrooms` | float | 是 | 卫生间数 |
| `year_built` | int | 是 | 建成年份 |
| `lot_size` | float | 是 | 占地面积 |
| `distance_to_city_center` | float | 是 | 距市中心距离 |
| `school_rating` | float | 是 | 学区评分 |
| `predicted_price` | float \| null | 否 | 预测结果；可显式传 `null` 清空 |

**不接受** `predicted_at` 字段；预测时间仅由“再预测”接口或服务端在 `predicted_price` 变更时写入。

请求示例（清空预测结果）：

```json
{
  "title": "Updated draft",
  "location": "Shanghai Pudong",
  "square_footage": 130.0,
  "bedrooms": 3.0,
  "bathrooms": 2.0,
  "year_built": 2015,
  "lot_size": 320.0,
  "distance_to_city_center": 8.0,
  "school_rating": 8.5,
  "predicted_price": null
}
```

### 10.4 成功响应

结构与 §7.3 相同，返回更新后的 `PredictionHistoryDetail`。

### 10.5 失败响应

| 场景 | `code` | `msg`（示例） |
| --- | --- | --- |
| 未携带 Token | `401` | `Not Authenticated` |
| Token 非法 / 过期 | `401` | `Invalid token` / `Token expired` |
| 实例不存在 / 不属于当前用户 / 已逻辑删除 | `404` | `Prediction history not found` |
| 请求体缺少字段 / 类型非法 | `422` | 参数校验错误信息 |

### 10.6 服务端处理逻辑

1. 校验实例存在且归属当前用户。
2. 应用整体覆盖更新。
3. 若 `predicted_price` 为 `null`，同步清空 `predicted_at`。
4. 若 `predicted_price` 与库中值不同且非空，更新 `predicted_at = timezone.now()`。
5. `updated_at` 由 ORM `auto_now` 自动刷新。
6. 返回最新详情。

## 11. 对预测实例再次预测

### 11.1 基本信息

| 项目 | 内容 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/api/v1/predictions/{id}/predict` |
| Summary | `对房价预测实例再次预测` |
| 鉴权 | `Authorization: Bearer <token>`（`DependsJwtAuth`） |
| Response | `ResponseSchemaModel[PredictionHistoryDetail]` |

### 11.2 路径参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `id` | int | 预测实例 ID |

### 11.3 请求参数

无请求体（或允许空 JSON 对象 `{}`）。

### 11.4 成功响应

结构与 §7.3 相同；`predicted_price` 与 `predicted_at` 为本次推理结果与时间。

### 11.5 失败响应

| 场景 | `code` | `msg`（示例） |
| --- | --- | --- |
| 未携带 Token | `401` | `Not Authenticated` |
| Token 非法 / 过期 | `401` | `Invalid token` / `Token expired` |
| 实例不存在 / 不属于当前用户 / 已逻辑删除 | `404` | `Prediction history not found` |
| 模型工件缺失 / 推理失败 | `400` / `500` | 与 §4.4 一致 |

### 11.6 服务端处理逻辑

1. 取出实例（用户归属 + 未删除）。
2. 从实例读取 7 个特征字段，调用 `PredictionService.predict([features])`。
3. 回写 `predicted_price`、`predicted_at = timezone.now()`。
4. 返回最新详情。

产品流程说明：

- **直接对已保存特征再预测**：调用本接口。
- **先改字段、再预测、再保存**：使用 `POST /api/v1/predict` + `PUT /api/v1/predictions/{id}`，无需调用本接口。

## 12. 逻辑删除预测实例

### 12.1 基本信息

| 项目 | 内容 |
| --- | --- |
| 方法 | `DELETE` |
| 路径 | `/api/v1/predictions/{id}` |
| Summary | `逻辑删除房价预测实例` |
| 鉴权 | `Authorization: Bearer <token>`（`DependsJwtAuth`） |
| Response | `ResponseModel` |

### 12.2 路径参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `id` | int | 预测实例 ID |

### 12.3 请求参数

无请求体。

```http
DELETE /api/v1/predictions/12
Authorization: Bearer <access_token>
```

### 12.4 成功响应

```json
{
  "code": 200,
  "msg": "Request succeeded",
  "data": null
}
```

### 12.5 失败响应

| 场景 | `code` | `msg`（示例） |
| --- | --- | --- |
| 未携带 Token | `401` | `Not Authenticated` |
| Token 非法 / 过期 | `401` | `Invalid token` / `Token expired` |
| 实例不存在 / 不属于当前用户 | `404` | `Prediction history not found` |
| 实例已逻辑删除（重复删除） | `404` | `Prediction history not found` |

### 12.6 服务端处理逻辑

1. 按 `id` + `user_id = current_user.id` + `is_deleted = false` 查询。
2. 设置 `is_deleted = true`、`deleted_at = timezone.now()`。
3. 返回成功；后续列表、详情、编辑、再预测均不可见。

## 13. Schema 设计

文件：`backend/app/prediction/schema/prediction_history.py`（新增）

### 13.1 输入 Schema

```python
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
```

### 13.2 输出 Schema

```python
class PredictionHistoryDetail(SchemaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str | None = None
    location: str | None = None
    square_footage: float
    bedrooms: float
    bathrooms: float
    year_built: int
    lot_size: float
    distance_to_city_center: float
    school_rating: float
    predicted_price: float | None = None
    predicted_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class PredictionHistoryListItem(PredictionHistoryDetail):
    """列表项与详情字段一致。"""
```

既有预测 Schema（`backend/app/prediction/schema/prediction.py`）：

```python
class HouseFeatures(SchemaBase):
    square_footage: float
    bedrooms: float
    bathrooms: float
    year_built: int
    lot_size: float
    distance_to_city_center: float
    school_rating: float
```

## 14. 鉴权设计

### 14.1 受保护接口范围

以下接口需要 `Authorization: Bearer <token>`：

- `POST /api/v1/predictions`
- `GET /api/v1/predictions`
- `GET /api/v1/predictions/{id}`
- `PUT /api/v1/predictions/{id}`
- `POST /api/v1/predictions/{id}/predict`
- `DELETE /api/v1/predictions/{id}`

### 14.2 认证流程

1. 从 `Authorization: Bearer <token>` 解析 Token。
2. JWT 解码并校验，得到 `sub`（用户 ID）。
3. 按 ID 查询用户；不存在则拒绝。
4. 校验 `status` 启用。
5. 注入 `CurrentUser` 到路由处理函数。

依赖注入：`CurrentUser`、`DependsJwtAuth`（`backend/common/security/jwt.py`）。

### 14.3 数据隔离

所有预测历史读写均在服务层附加 `user_id = current_user.id` 条件；跨用户访问统一返回 `404 Prediction history not found`。

## 15. 路由与代码位置

| 内容 | 文件 |
| --- | --- |
| 房价预测、模型信息、健康检查 | `backend/app/prediction/api/v1/prediction.py` |
| 预测历史 CRUD | `backend/app/prediction/api/v1/prediction_history.py`（新增） |
| 路由聚合 | `backend/app/prediction/api/router.py` |
| 预测 Service | `backend/app/prediction/service/prediction_service.py` |
| 预测历史 Service | `backend/app/prediction/service/prediction_history_service.py`（新增） |
| 预测历史 CRUD | `backend/app/prediction/crud/crud_prediction_history.py`（新增） |
| 预测 Schema | `backend/app/prediction/schema/prediction.py` |
| 预测历史 Schema | `backend/app/prediction/schema/prediction_history.py`（新增） |
| 预测历史 Model | `backend/app/prediction/model/prediction_history.py`（新增） |
| JWT 与认证依赖 | `backend/common/security/jwt.py` |
| 分页 | `backend/common/pagination.py` |

路由挂载（`backend/app/prediction/api/router.py`）：

```python
v1 = APIRouter(prefix=settings.FASTAPI_API_V1_PATH)
v1.include_router(prediction_router)
v1.include_router(prediction_history_router, prefix='/predictions')
```

## 16. 兼容性说明

| 项 | 说明 |
| --- | --- |
| `POST /api/v1/predict` | 完全兼容，未改动请求/响应契约 |
| `GET /api/v1/model-info` | 完全兼容 |
| `GET /api/v1/health` | 完全兼容 |
| 新增 `/api/v1/predictions/*` | 新增能力，对老调用方无影响 |
| 登录鉴权 | 复用现有 JWT；客户端须先 `POST /api/v1/auth/login` 获取 Token |
| 路径命名 | `/predict` 为推理动作，`/predictions` 为资源集合，避免混淆 |

## 17. 验收标准

- `POST /api/v1/predict` 单笔与批次模式响应结构与 §4.3、§4.4 一致，行为未变更。
- `POST /api/v1/predictions` 登录后可创建实例；含 `predicted_price` 时 `predicted_at` 非空；不含时均为 `null`。
- `GET /api/v1/predictions` 仅返回当前用户、未逻辑删除的记录；分页字段与 `PageData[T]` 契约一致。
- 列表支持 §8.2 全部搜索参数；默认按 `updated_at DESC, id DESC` 排序。
- `GET /api/v1/predictions/{id}` 对自己实例返回 `200`；对他人或已删除实例返回 `404`。
- `PUT /api/v1/predictions/{id}` 可整体覆盖；`predicted_price=null` 时 `predicted_at` 同步清空。
- `POST /api/v1/predictions/{id}/predict` 回写最新 `predicted_price` 与 `predicted_at`。
- `DELETE /api/v1/predictions/{id}` 返回 `200`、`data=null`；重复删除返回 `404`；删除后列表/详情/编辑/再预测均不可见。
- 未登录访问任意 `/api/v1/predictions/*` 返回 `401`。
- 所有使用 `response_base` 的接口响应结构与 `ResponseModel` / `ResponseSchemaModel` 一致。
