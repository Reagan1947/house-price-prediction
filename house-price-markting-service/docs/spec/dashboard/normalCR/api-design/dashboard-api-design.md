# Analysis Dashboard API 设计

## 1. 接口概述

本文档定义 Analysis Dashboard 后端接口契约。接口用于接收房屋数据筛选条件，并返回 Dashboard 所需的数值指标和图表数据。

## 2. 接口清单

| 接口名称 | 方法 | 路径 | 说明 |
| --- | --- | --- | --- |
| dashboard | POST | `/dashboard` | 查询 Dashboard 指标和图表数据 |

## 3. 查询 Dashboard 数据

### 3.1 基本信息

| 项 | 值 |
| --- | --- |
| 接口名称 | dashboard |
| 请求方法 | POST |
| 请求路径 | `/dashboard` |
| Content-Type | `application/json` |
| 响应类型 | `BaseResponse<DashboardVO>` |
| 认证 | 必须携带 `Authorization: Bearer <token>`，后端查询数据前调用外部 Token 校验接口 |

Controller 方法：

```java
@PostMapping
public BaseResponse<DashboardVO> dashboard(
        @RequestHeader("Authorization") String authorization,
        @RequestBody DashboardQueryRequest request
)
```

### 3.2 请求头

| 参数 | 位置 | 类型 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- | --- | --- |
| Authorization | header | String | 是 | `Bearer <token>` | 用户 Bearer Token，后端会透传给外部认证服务校验 |

### 3.3 请求参数

请求体：`DashboardQueryRequest`

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| minId | Long | 否 | - | ID 最小值 |
| maxId | Long | 否 | - | ID 最大值 |
| minSquareFootage | BigDecimal | 否 | - | 面积最小值 |
| maxSquareFootage | BigDecimal | 否 | - | 面积最大值 |
| minBedrooms | Integer | 否 | - | 卧室数量最小值 |
| maxBedrooms | Integer | 否 | - | 卧室数量最大值 |
| minBathrooms | BigDecimal | 否 | - | 浴室数量最小值 |
| maxBathrooms | BigDecimal | 否 | - | 浴室数量最大值 |
| minYearBuilt | Integer | 否 | - | 建造年份最小值 |
| maxYearBuilt | Integer | 否 | - | 建造年份最大值 |
| minLotSize | BigDecimal | 否 | - | 土地面积最小值 |
| maxLotSize | BigDecimal | 否 | - | 土地面积最大值 |
| minDistanceToCityCenter | BigDecimal | 否 | - | 距离市中心最小值 |
| maxDistanceToCityCenter | BigDecimal | 否 | - | 距离市中心最大值 |
| minSchoolRating | BigDecimal | 否 | - | 学校评分最小值 |
| maxSchoolRating | BigDecimal | 否 | - | 学校评分最大值 |
| minPrice | BigDecimal | 否 | - | 价格最小值 |
| maxPrice | BigDecimal | 否 | - | 价格最大值 |
| priceBucketCount | Integer | 否 | 10 | 价格分布区间数量 |
| scatterLimit | Integer | 否 | 1000 | 散点图最大返回点数 |

### 3.4 请求示例

```json
{
  "minSquareFootage": 1000,
  "maxSquareFootage": 2200,
  "minBedrooms": 2,
  "maxBedrooms": 4,
  "minPrice": 150000,
  "maxPrice": 350000,
  "priceBucketCount": 10,
  "scatterLimit": 1000
}
```

空请求体或 `{}` 表示不进行字段筛选。

## 4. 外部 Token 校验接口

Dashboard 接口在执行任何数据库查询前，必须调用外部认证服务校验 token。

| 项 | 值 |
| --- | --- |
| URL | `http://114.67.76.100:8001/api/v1/auth/verify` |
| Method | GET |
| Header | `Authorization: Bearer <token>` |
| 成功状态码 | 200 |
| 失败状态码 | 401 |

成功响应：

```json
{
  "code": 200,
  "msg": "Request succeeded",
  "data": {
    "valid": true,
    "user_id": 1,
    "username": "admin",
    "email": "admin@example.com"
  }
}
```

校验规则：

1. 缺少 `Authorization` 请求头时，不调用数据库，直接返回未授权错误。
2. 外部接口返回 HTTP 401 时，不调用数据库，直接返回未授权错误。
3. 外部接口返回 HTTP 200 但 `data.valid != true` 时，不调用数据库，直接返回未授权错误。
4. 外部接口调用超时或网络异常时，不调用数据库，返回认证服务不可用或统一业务错误。
5. 外部接口校验通过后，才允许执行 Dashboard 统计查询。

## 5. 响应设计

### 5.1 响应结构

响应体：`BaseResponse<DashboardVO>`

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "metrics": {
      "totalRecords": 120,
      "avgPrice": 245600.25,
      "medianPrice": 238000.00,
      "avgPricePerSqFt": 162.35,
      "deltaVsBaseline": {
        "avgPredictedPrice": 8.50,
        "medianPredictedPrice": 5.20,
        "avgPricePerSquareFoot": 12.30
      }
    },
    "priceDistribution": [
      {
        "bucketStart": 100000.00,
        "bucketEnd": 150000.00,
        "label": "100000-150000",
        "count": 12
      }
    ],
    "priceSquareScatter": [
      {
        "squareFootage": 1250.00,
        "price": 185000.00
      }
    ],
    "priceYearTrend": [
      {
        "yearBuilt": 1985,
        "avgPrice": 185000.00,
        "count": 8
      }
    ]
  }
}
```

### 5.2 DashboardVO

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| metrics | `DashboardMetricsVO` | 数值指标 |
| priceDistribution | `List<PriceDistributionPointVO>` | 价格分布柱状图数据 |
| priceSquareScatter | `List<PriceSquareScatterPointVO>` | 价格与面积散点图数据 |
| priceYearTrend | `List<PriceYearTrendPointVO>` | 价格与年份趋势图数据 |

### 5.3 DashboardMetricsVO

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| totalRecords | Long | 筛选后的记录数 |
| avgPrice | BigDecimal | 筛选后的平均价格 |
| medianPrice | BigDecimal | 筛选后的价格中位数 |
| avgPricePerSqFt | BigDecimal | 筛选后的平均每平方英尺价格 |
| deltaVsBaseline | `DashboardDeltaVsBaselineVO` | 相对全量基准的增减百分比 |

### 5.3.1 DashboardDeltaVsBaselineVO

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| avgPredictedPrice | BigDecimal | 平均价格增减百分比，对应 `avgPrice` |
| medianPredictedPrice | BigDecimal | 中位数价格增减百分比，对应 `medianPrice` |
| avgPricePerSquareFoot | BigDecimal | 平均每平方英尺价格增减百分比，对应 `avgPricePerSqFt` |

增减百分比计算规则：

1. 基准数据为不带任何筛选条件的全量统计值。
2. 增减百分比 = `(筛选后指标 - 全量基准指标) / 全量基准指标 * 100`，保留 2 位小数；正数表示增长，负数表示下降。
3. 无筛选条件时，三个字段均为 `0`。
4. 全量基准指标为 0 且筛选后指标也为 0 时，结果为 `0`；全量基准为 0 且筛选后指标大于 0 时，结果为 `null`。

### 5.4 PriceDistributionPointVO

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| bucketStart | BigDecimal | 区间起始价格 |
| bucketEnd | BigDecimal | 区间结束价格 |
| label | String | 前端展示标签 |
| count | Long | 当前价格区间房屋数量 |

### 5.5 PriceSquareScatterPointVO

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| squareFootage | BigDecimal | 面积 |
| price | BigDecimal | 价格 |

### 5.6 PriceYearTrendPointVO

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| yearBuilt | Integer | 建造年份 |
| avgPrice | BigDecimal | 该年份平均价格 |
| count | Long | 该年份记录数 |

## 6. 参数校验规则

| 参数组 | 规则 |
| --- | --- |
| 所有区间参数 | 同一字段最小值和最大值同时存在时，必须满足最小值不大于最大值 |
| id | `minId`、`maxId` 必须大于等于 1 |
| squareFootage | 必须大于 0 |
| bedrooms | 必须大于等于 0 |
| bathrooms | 必须大于等于 0 |
| yearBuilt | 必须在 `[1800, currentYear]` 内 |
| lotSize | 必须大于 0 |
| distanceToCityCenter | 必须大于等于 0 |
| schoolRating | 必须在 `[0, 10]` 内 |
| price | 必须大于等于 0 |
| priceBucketCount | 范围 `[1, 50]`，为空时默认 10 |
| scatterLimit | 范围 `[1, 5000]`，为空时默认 1000 |

参数校验失败时返回项目统一错误响应，错误码使用 `RespCode.ERROR_PARAMETER`。

## 7. 空数据响应

筛选后无数据时，接口仍返回成功响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "metrics": {
      "totalRecords": 0,
      "avgPrice": 0,
      "medianPrice": 0,
      "avgPricePerSqFt": 0
    },
    "priceDistribution": [],
    "priceSquareScatter": [],
    "priceYearTrend": []
  }
}
```

## 8. 接口验收点

1. `POST /dashboard` 必须携带 `Authorization` 请求头。
2. 后端必须先调用 `http://114.67.76.100:8001/api/v1/auth/verify`，校验通过后才查询数据库。
3. 外部 Token 校验失败、缺少 token、token 过期、用户锁定等场景不执行 Dashboard 查询。
4. 接口支持空请求和完整筛选请求。
5. 所有字段均支持最小值、最大值区间筛选。
6. 响应包含 4 个数值指标和 3 类图表数据。
7. 非法区间和非法取值返回统一参数错误。
8. 筛选后无数据时返回空图表数组，不返回接口错误。
