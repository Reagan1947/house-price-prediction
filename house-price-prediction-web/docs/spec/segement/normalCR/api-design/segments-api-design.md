# Segments 分析 API 设计

## 1. 接口概述

本文档定义 Segments 分析后端接口契约。接口在房屋明细数据上按用户选择的维度进行分组聚合，分别提供**聚合表（Table）**与**双轴图（Chart）**数据。

- 需求：`../requirements/segments-analysis.md`
- 详细设计：`../detail-design/segments-analysis-detail-design.md`
- 数据与 SQL：`../db-design/segments-db-design.md`
- 区间筛选语义与 `POST /dashboard` 对齐，见 `docs/spec/dashboard/normalCR/api-design/dashboard-api-design.md`

## 2. 接口清单

| 接口名称 | 方法 | 路径 | 响应类型 | 说明 |
| --- | --- | --- | --- | --- |
| segmentTable | POST | `/segments/table` | `BaseResponse<SegmentTableVO>` | 分组聚合表 |
| segmentChart | POST | `/segments/chart` | `BaseResponse<SegmentChartVO>` | 双轴图数据 |

两个接口共用请求体 `SegmentQueryRequest`，认证与外部 Token 校验规则与 Dashboard 相同。

## 3. 公共约定

### 3.1 认证

| 项 | 值 |
| --- | --- |
| 请求头 | `Authorization: Bearer <token>` |
| 校验时机 | 任何数据库查询之前 |
| 外部校验 URL | `http://114.67.76.100:8001/api/v1/auth/verify` |
| 外部校验方法 | GET |

校验规则（与 Dashboard 一致）：

1. 缺少 `Authorization` → 未授权，不查库。
2. 外部接口 HTTP 401 → 未授权，不查库。
3. 外部接口 HTTP 200 但 `data.valid != true` → 未授权，不查库。
4. 外部接口超时或网络异常 → 认证服务不可用或统一业务错误，不查库。

### 3.2 Content-Type 与参数来源

| 项 | 值 |
| --- | --- |
| Content-Type | `application/json`（推荐） |
| Body | `@RequestBody SegmentQueryRequest` |
| Query / Form | `@ModelAttribute SegmentQueryRequest`（可选） |
| 合并优先级 | **body > query/form > filters** |

### 3.3 统一响应包装

`BaseResponse<T>`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| code | int | 业务状态码 |
| message | String | 描述信息 |
| data | T | 业务数据 |

## 4. 请求体 SegmentQueryRequest

### 4.1 分组维度（Segments 专有）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| segmentDimension | String | **是** | 分组维度，见 4.2 |

### 4.2 segmentDimension 取值

| 值 | 说明 |
| --- | --- |
| `bedrooms` | 按卧室数原值分组 |
| `bathrooms` | 按浴室数原值分组 |
| `year_built_decade` | 按建造年代（十年）分组，展示如 `1980s` |
| `school_rating_band` | 按学校评分 2 分一档分组，展示如 `6-8` |
| `distance_band` | 按距市中心距离 2 英里一档分组，展示如 `2-4` |

非法或缺失时返回 `RespCode.ERROR_PARAMETER`。

### 4.3 区间筛选字段（与 Dashboard 一致）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| minId | Long | 否 | ID 最小值 |
| maxId | Long | 否 | ID 最大值 |
| minSquareFootage | BigDecimal | 否 | 面积最小值 |
| maxSquareFootage | BigDecimal | 否 | 面积最大值 |
| minBedrooms | Integer | 否 | 卧室数量最小值 |
| maxBedrooms | Integer | 否 | 卧室数量最大值 |
| minBathrooms | BigDecimal | 否 | 浴室数量最小值 |
| maxBathrooms | BigDecimal | 否 | 浴室数量最大值 |
| minYearBuilt | Integer | 否 | 建造年份最小值 |
| maxYearBuilt | Integer | 否 | 建造年份最大值 |
| minLotSize | BigDecimal | 否 | 土地面积最小值 |
| maxLotSize | BigDecimal | 否 | 土地面积最大值 |
| minDistanceToCityCenter | BigDecimal | 否 | 距离市中心最小值 |
| maxDistanceToCityCenter | BigDecimal | 否 | 距离市中心最大值 |
| minSchoolRating | BigDecimal | 否 | 学校评分最小值 |
| maxSchoolRating | BigDecimal | 否 | 学校评分最大值 |
| minPrice | BigDecimal | 否 | 价格最小值 |
| maxPrice | BigDecimal | 否 | 价格最大值 |
| filters | Object | 否 | 嵌套筛选；字段与上表相同，可含 `segmentDimension` |

**不包含** Dashboard 专有参数：`priceBucketCount`、`scatterLimit`。

### 4.4 筛选语义

1. 仅传 `minX` → `column >= minX`。
2. 仅传 `maxX` → `column <= maxX`。
3. 同时传 Min / Max → `minX <= column <= maxX`。
4. 除 `segmentDimension` 外无其他筛选字段 → 对全量 `house_record` 分组。
5. 先按区间筛选行，再按 `segmentDimension` 分组聚合。

### 4.5 请求示例

Table 与 Chart 使用相同请求体：

```json
{
  "segmentDimension": "bedrooms",
  "minSquareFootage": 1000,
  "maxSquareFootage": 2200,
  "minBedrooms": 2,
  "maxBedrooms": 4,
  "minPrice": 150000,
  "maxPrice": 350000
}
```

仅切换维度：

```json
{
  "segmentDimension": "year_built_decade"
}
```

嵌套 `filters` 示例：

```json
{
  "segmentDimension": "distance_band",
  "filters": {
    "minPrice": 200000,
    "maxDistanceToCityCenter": 6
  }
}
```

## 5. 查询 Segments 聚合表

### 5.1 基本信息

| 项 | 值 |
| --- | --- |
| 接口名称 | segmentTable |
| 请求方法 | POST |
| 请求路径 | `/segments/table` |
| 响应类型 | `BaseResponse<SegmentTableVO>` |

Controller 方法：

```java
@PostMapping("/table")
public BaseResponse<SegmentTableVO> table(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestBody(required = false) SegmentQueryRequest body,
        @ModelAttribute SegmentQueryRequest queryParams);
```

### 5.2 成功响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "segmentDimension": "bedrooms",
    "rows": [
      {
        "group": "2",
        "groupKey": "2",
        "count": 1,
        "median": 185000.00,
        "mean": 185000.00,
        "p25": 185000.00,
        "p75": 185000.00,
        "stdDev": 0.00
      },
      {
        "group": "3",
        "groupKey": "3",
        "count": 2,
        "median": 237500.00,
        "mean": 237500.00,
        "p25": 210000.00,
        "p75": 265000.00,
        "stdDev": 38890.87
      }
    ]
  }
}
```

### 5.3 SegmentTableVO

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| segmentDimension | String | 回显请求维度 |
| rows | `List<SegmentGroupRowVO>` | 聚合表行，按 `groupKey` 升序 |

### 5.4 SegmentGroupRowVO

| 字段 | 类型 | 对应需求列 | 说明 |
| --- | --- | --- | --- |
| group | String | Group | 展示标签 |
| groupKey | String | - | 稳定排序键 |
| count | Long | Count | 分组内记录数 |
| median | BigDecimal | Median | 价格中位数，保留 2 位小数 |
| mean | BigDecimal | Mean | 价格平均值 |
| p25 | BigDecimal | P25 | 价格 25 分位 |
| p75 | BigDecimal | P75 | 价格 75 分位 |
| stdDev | BigDecimal | Std Dev | 价格总体标准差 `STDDEV_POP` |

组内仅 1 条记录时：`median = mean = p25 = p75 = price`，`stdDev = 0`。

### 5.5 空数据响应

筛选后无记录或无分组时：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "segmentDimension": "bedrooms",
    "rows": []
  }
}
```

## 6. 查询 Segments 图表数据

### 6.1 基本信息

| 项 | 值 |
| --- | --- |
| 接口名称 | segmentChart |
| 请求方法 | POST |
| 请求路径 | `/segments/chart` |
| 响应类型 | `BaseResponse<SegmentChartVO>` |

Controller 方法：

```java
@PostMapping("/chart")
public BaseResponse<SegmentChartVO> chart(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestBody(required = false) SegmentQueryRequest body,
        @ModelAttribute SegmentQueryRequest queryParams);
```

### 6.2 成功响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "segmentDimension": "bedrooms",
    "points": [
      {
        "group": "2",
        "groupKey": "2",
        "count": 1,
        "medianPrice": 185000.00
      },
      {
        "group": "3",
        "groupKey": "3",
        "count": 2,
        "medianPrice": 237500.00
      }
    ]
  }
}
```

### 6.3 SegmentChartVO

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| segmentDimension | String | 回显请求维度 |
| points | `List<SegmentChartPointVO>` | 图表点，按 `groupKey` 升序 |

### 6.4 SegmentChartPointVO

| 字段 | 类型 | 图表用途 | 说明 |
| --- | --- | --- | --- |
| group | String | X 轴分类 | 与 Table `group` 一致 |
| groupKey | String | - | 与 Table `groupKey` 一致 |
| count | Long | 左轴 Count | 分组记录数 |
| medianPrice | BigDecimal | 右轴 Median Price | 与 Table 同行 `median` 相同 |

### 6.5 空数据响应

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "segmentDimension": "bedrooms",
    "points": []
  }
}
```

## 7. 参数校验规则

### 7.1 segmentDimension

| 规则 | 错误示例 |
| --- | --- |
| 必填 | 请求体无 `segmentDimension` |
| 必须为 4.2 五种取值之一 | `"segmentDimension": "city"` |

### 7.2 区间筛选（与 Dashboard 第 6 节一致）

| 参数组 | 规则 |
| --- | --- |
| 所有区间参数 | Min、Max 同时存在时，`min <= max` |
| id | `minId`、`maxId` >= 1 |
| squareFootage | > 0 |
| bedrooms | >= 0 |
| bathrooms | >= 0 |
| yearBuilt | `[1800, currentYear]` |
| lotSize | > 0 |
| distanceToCityCenter | >= 0 |
| schoolRating | `[0, 10]` |
| price | >= 0 |

校验失败返回 `RespCode.ERROR_PARAMETER`。

## 8. 错误响应

### 8.1 未授权

缺少或无效 Token 时，不执行 Segments 查询，返回项目统一未授权响应（与 Dashboard 一致）。

### 8.2 参数错误

```json
{
  "code": 400,
  "message": "参数错误",
  "data": null
}
```

具体 `code` / `message` 以项目 `RespCode` 实现为准。

## 9. 前端调用约定

1. 同一筛选状态下，Table 与 Chart 应使用**相同** `SegmentQueryRequest` 分别调用两个接口。
2. 筛选条件变更或 `segmentDimension` 切换时，建议并行请求 `/segments/table` 与 `/segments/chart`。
3. 聚合表列头排序、数值列 `tabular-nums` 由前端完成，无需额外排序参数。
4. 双轴图：左轴绑定 `count`，右轴绑定 `medianPrice`。

## 10. Table 与 Chart 一致性

在相同 `SegmentQueryRequest` 下：

| 约束 | 说明 |
| --- | --- |
| 分组集合一致 | `rows` 与 `points` 的 `groupKey` 集合相同 |
| 组数一致 | `rows.length == points.length` |
| count 一致 | 同一 `groupKey` 的 `count` 相同 |
| 中位数一致 | 同一 `groupKey` 的 `median` 与 `medianPrice` 相同 |

## 11. 接口验收点

1. `POST /segments/table`、`POST /segments/chart` 均必须携带有效 `Authorization`。
2. Token 校验通过后才执行数据库查询。
3. `segmentDimension` 必填且仅支持五种枚举值。
4. 支持 Dashboard 全部 Min / Max 区间筛选及 `filters` 嵌套合并。
5. Table 返回 `Group` 对应列及完整统计指标；Chart 返回 `count` 与 `medianPrice`。
6. 非法区间、非法维度返回统一参数错误。
7. 筛选后无数据时返回空 `rows` / `points`，HTTP 业务仍成功。
8. 相同请求下 Table 与 Chart 分组及 `count`、中位数保持一致。
