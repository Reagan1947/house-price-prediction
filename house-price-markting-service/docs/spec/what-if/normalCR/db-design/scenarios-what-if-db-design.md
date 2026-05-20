# Scenarios What-if DB 设计

## 1. 数据库设计目标

What-if 分析在 Dashboard 共用的房屋明细表 `house_record` 上，先按 Min / Max 区间筛选得到集合 S，再对 S 中 **7 个房屋特征列** 分别计算 **中位数（median）**，组装为 Baseline `HouseFeatures`。场景预测不访问本库，由 `PredictClient` 调用外部 prediction-service。

本设计定义：

1. 复用的表结构与筛选 SQL（与 Dashboard 一致）。
2. Baseline 记录数统计与 7 列 median 聚合 SQL。
3. Mapper 方法、结果映射与边界处理。

**不新增业务表。** 表结构详见 `docs/spec/dashboard/normalCR/db-design/dashboard-db-design.md`。

- 需求：`../requirements/scenarios-what-if.md`
- 详细设计：`../detail-design/scenarios-what-if-detail-design.md`
- API 契约：`../api-design/scenarios-what-if-api-design.md`

## 2. 数据表依赖

### 2.1 表：house_record

What-if Baseline 依赖字段：

| 字段 | 类型 | What-if 用途 |
| --- | --- | --- |
| id | BIGINT | 区间筛选 |
| square_footage | DECIMAL(12,2) | 筛选；median → Baseline.squareFootage |
| bedrooms | INT | 筛选；median → Baseline.bedrooms |
| bathrooms | DECIMAL(3,1) | 筛选；median → Baseline.bathrooms |
| year_built | INT | 筛选；median → Baseline.yearBuilt |
| lot_size | DECIMAL(12,2) | 筛选；median → Baseline.lotSize |
| distance_to_city_center | DECIMAL(10,2) | 筛选；median → Baseline.distanceToCityCenter |
| school_rating | DECIMAL(4,2) | 筛选；median → Baseline.schoolRating |
| price | DECIMAL(14,2) | 仅用于区间筛选（`minPrice` / `maxPrice`），**不参与** Baseline 特征 median |

**说明：** Baseline 的 7 维特征均来自筛选后样本的 median，与 `price` 列无关；预测房价由外部模型根据特征计算。

### 2.2 索引

复用 Dashboard 已有索引，无需为 What-if 单独建表或强制新增索引：

| 索引 | 字段 |
| --- | --- |
| PRIMARY | id |
| idx_price | price |
| idx_square_footage | square_footage |
| idx_year_built | year_built |
| idx_bedrooms | bedrooms |
| idx_bathrooms | bathrooms |

Baseline 查询对筛选后子集做 7 次列中位数计算，主要成本在窗口排序；筛选字段已有索引即可支撑与 Dashboard 相同的访问模式。

## 3. 公共筛选 SQL

What-if **必须**复用 `HouseRecordMapper.xml` 中已有片段：

| 片段 ID | 用途 |
| --- | --- |
| `DashboardFilter` | `countByFilter`、`selectBaselineFeatures` |

请求对象类型为 `WhatIfBaselineQueryRequest`（继承 `DashboardQueryRequest`），MyBatis 中 `request` 属性需包含与 Dashboard 相同的 Min / Max 字段，以保证 `<if test="request.minBedrooms != null">` 等条件生效。

筛选逻辑与 `docs/spec/dashboard/normalCR/db-design/dashboard-db-design.md` 第 6 节一致。

## 4. Median 算法约定

与 Dashboard `selectMedianPrice` 相同，采用 MySQL 8 窗口函数：

1. 对筛选后某一列 `col` 按升序 `ROW_NUMBER()`。
2. 取 `row_num IN (FLOOR((total_count + 1) / 2), FLOOR((total_count + 2) / 2))` 的行。
3. 对 1～2 行取 `AVG(col)` 作为该列 median。
4. 按字段类型 `ROUND`：

| 列 | ROUND 精度 |
| --- | --- |
| square_footage, lot_size, distance_to_city_center, school_rating | 2 位小数 |
| bathrooms | 1 位小数 |
| bedrooms, year_built | 0 位（整数） |

**单条记录（total_count = 1）：** 该列 median 等于该条记录的值。

**空集合（total_count = 0）：** 不执行 `selectBaselineFeatures`；Service 在 `countByFilter = 0` 时直接返回业务错误。

## 5. 记录数统计 SQL

### 5.1 Mapper 方法

```java
Long countByFilter(@Param("request") WhatIfBaselineQueryRequest request);
```

### 5.2 SQL

```sql
SELECT COUNT(*) AS recordCount
FROM house_record
<include refid="DashboardFilter"/>
```

### 5.3 用途

- Baseline 接口响应字段 `recordCount`。
- Service 层在 `recordCount = 0` 时短路，避免无意义的 median 与预测调用。

## 6. Baseline 特征 Median SQL

### 6.1 Mapper 方法

```java
HouseFeaturesVO selectBaselineFeatures(@Param("request") WhatIfBaselineQueryRequest request);
```

返回类型映射 `HouseFeaturesVO`（7 个特征字段，见第 8 节）。

### 6.2 可复用 SQL 片段

建议在 `HouseRecordMapper.xml` 新增 `<sql id="BaselineMedianSubquery">`，参数化列名（实现时可用 7 个独立子查询或 MyBatis 动态 SQL，下列为单列模板）：

```xml
<!-- column: 数据库列名；roundScale: ROUND 小数位数 -->
<sql id="BaselineMedianSubquery">
    SELECT ROUND(COALESCE(AVG(${column}), 0), ${roundScale})
    FROM (
        SELECT ${column} AS col_value,
               ROW_NUMBER() OVER (ORDER BY ${column}) AS row_num,
               COUNT(*) OVER () AS total_count
        FROM house_record
        <include refid="DashboardFilter"/>
    ) ranked
    WHERE row_num IN (FLOOR((total_count + 1) / 2), FLOOR((total_count + 2) / 2))
</sql>
```

**注意：** `${column}` 仅允许白名单列名（由 XML 写死 7 列），禁止拼接用户输入。

### 6.3 完整查询（推荐实现）

一次 SELECT 返回 7 个 median，避免 7 次扫描：

```sql
SELECT
    (SELECT ROUND(COALESCE(AVG(square_footage), 0), 2)
     FROM (
         SELECT square_footage,
                ROW_NUMBER() OVER (ORDER BY square_footage) AS row_num,
                COUNT(*) OVER () AS total_count
         FROM house_record
         <include refid="DashboardFilter"/>
     ) t
     WHERE row_num IN (FLOOR((total_count + 1) / 2), FLOOR((total_count + 2) / 2))
    ) AS squareFootage,

    (SELECT ROUND(COALESCE(AVG(bedrooms), 0), 0)
     FROM (
         SELECT bedrooms,
                ROW_NUMBER() OVER (ORDER BY bedrooms) AS row_num,
                COUNT(*) OVER () AS total_count
         FROM house_record
         <include refid="DashboardFilter"/>
     ) t
     WHERE row_num IN (FLOOR((total_count + 1) / 2), FLOOR((total_count + 2) / 2))
    ) AS bedrooms,

    (SELECT ROUND(COALESCE(AVG(bathrooms), 0), 1)
     FROM (
         SELECT bathrooms,
                ROW_NUMBER() OVER (ORDER BY bathrooms) AS row_num,
                COUNT(*) OVER () AS total_count
         FROM house_record
         <include refid="DashboardFilter"/>
     ) t
     WHERE row_num IN (FLOOR((total_count + 1) / 2), FLOOR((total_count + 2) / 2))
    ) AS bathrooms,

    (SELECT ROUND(COALESCE(AVG(year_built), 0), 0)
     FROM (
         SELECT year_built,
                ROW_NUMBER() OVER (ORDER BY year_built) AS row_num,
                COUNT(*) OVER () AS total_count
         FROM house_record
         <include refid="DashboardFilter"/>
     ) t
     WHERE row_num IN (FLOOR((total_count + 1) / 2), FLOOR((total_count + 2) / 2))
    ) AS yearBuilt,

    (SELECT ROUND(COALESCE(AVG(lot_size), 0), 2)
     FROM (
         SELECT lot_size,
                ROW_NUMBER() OVER (ORDER BY lot_size) AS row_num,
                COUNT(*) OVER () AS total_count
         FROM house_record
         <include refid="DashboardFilter"/>
     ) t
     WHERE row_num IN (FLOOR((total_count + 1) / 2), FLOOR((total_count + 2) / 2))
    ) AS lotSize,

    (SELECT ROUND(COALESCE(AVG(distance_to_city_center), 0), 2)
     FROM (
         SELECT distance_to_city_center,
                ROW_NUMBER() OVER (ORDER BY distance_to_city_center) AS row_num,
                COUNT(*) OVER () AS total_count
         FROM house_record
         <include refid="DashboardFilter"/>
     ) t
     WHERE row_num IN (FLOOR((total_count + 1) / 2), FLOOR((total_count + 2) / 2))
    ) AS distanceToCityCenter,

    (SELECT ROUND(COALESCE(AVG(school_rating), 0), 2)
     FROM (
         SELECT school_rating,
                ROW_NUMBER() OVER (ORDER BY school_rating) AS row_num,
                COUNT(*) OVER () AS total_count
         FROM house_record
         <include refid="DashboardFilter"/>
     ) t
     WHERE row_num IN (FLOOR((total_count + 1) / 2), FLOOR((total_count + 2) / 2))
    ) AS schoolRating
```

MyBatis `select` 示例：

```xml
<select id="selectBaselineFeatures"
        resultType="cn.com.housepriceprediction.module.whatif.entity.vo.HouseFeaturesVO">
    <!-- 上述 SELECT -->
</select>
```

### 6.4 性能说明

当前实现为 7 个子查询各扫描一次筛选结果集，在数据量较大时可评估改为：

1. 单次 CTE `filtered AS (SELECT * FROM house_record WHERE ...)`，7 列 median 均从 `filtered` 计算；或
2. 应用层缓存：相同筛选条件短时间内复用 Baseline（非本次范围）。

百万级数据前，与 Dashboard 保持一致的索引策略即可。

## 7. 场景预测与数据库的关系

| 能力 | 是否访问 MySQL |
| --- | --- |
| `POST /what-if/baseline` | 是：`countByFilter` + `selectBaselineFeatures` |
| `POST /what-if/scenarios/predict` | 否：仅 HTTP 调用 prediction-service |

prediction-service 请求/响应字段映射见 API 设计文档，不在 DB 层持久化。

## 8. 结果映射

### 8.1 HouseFeaturesVO

| 列别名 | Java 字段 | Java 类型 |
| --- | --- | --- |
| squareFootage | squareFootage | BigDecimal |
| bedrooms | bedrooms | Integer |
| bathrooms | bathrooms | BigDecimal |
| yearBuilt | yearBuilt | Integer |
| lotSize | lotSize | BigDecimal |
| distanceToCityCenter | distanceToCityCenter | BigDecimal |
| schoolRating | schoolRating | BigDecimal |

路径建议：`cn.com.housepriceprediction.module.whatif.entity.vo.HouseFeaturesVO`

### 8.2 BaselineVO 组装

`BaselineVO` 由 Service 组装，非 Mapper 直接返回：

| 字段 | 来源 |
| --- | --- |
| recordCount | `countByFilter` |
| features | `selectBaselineFeatures` |
| baselinePredictedPrice | `PredictClient.predictSingle(features)` |

## 9. Mapper 文件约定

路径：`src/main/resources/mapper/HouseRecordMapper.xml`

| 元素 | 操作 | 说明 |
| --- | --- | --- |
| `DashboardFilter` | 已有 | What-if 直接 include |
| `countByFilter` | 新增 select | 筛选后记录数 |
| `selectBaselineFeatures` | 新增 select | 7 列 median |

Java 接口：`cn.com.housepriceprediction.module.dashboard.mapper.HouseRecordMapper`

```java
Long countByFilter(@Param("request") WhatIfBaselineQueryRequest request);

HouseFeaturesVO selectBaselineFeatures(@Param("request") WhatIfBaselineQueryRequest request);
```

## 10. 边界与空结果

| 场景 | DB / Service 行为 |
| --- | --- |
| 筛选后 0 行 | `countByFilter = 0`；不调用 `selectBaselineFeatures`、不调预测 |
| 筛选后 1 行 | 各列 median = 该行对应列值 |
| 筛选后偶数行 | 各列 median = 中间两值平均（窗口算法） |
| 某列为 NULL | 表约束 NOT NULL；不应出现 |
| 非法筛选参数 | Service 校验失败，不执行 SQL |

## 11. 验证用例数据

使用 Dashboard 样例 3 条记录（无额外筛选）：

| id | square_footage | bedrooms | bathrooms | year_built | lot_size | distance | school_rating | price |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1250 | 2 | 1.0 | 1985 | 5200 | 3.2 | 7.1 | 185000 |
| 2 | 1850 | 3 | 2.0 | 1998 | 7500 | 5.6 | 8.2 | 265000 |
| 3 | 1420 | 3 | 2.0 | 1992 | 6800 | 2.8 | 6.9 | 210000 |

### 11.1 无筛选 Baseline median 期望值

| 字段 | 计算 | 期望值 |
| --- | --- | --- |
| squareFootage | median(1250, 1420, 1850) | 1420.00 |
| bedrooms | median(2, 3, 3) | 3 |
| bathrooms | median(1.0, 2.0, 2.0) | 2.0 |
| yearBuilt | median(1985, 1992, 1998) | 1992 |
| lotSize | median(5200, 6800, 7500) | 6800.00 |
| distanceToCityCenter | median(2.8, 3.2, 5.6) | 3.20 |
| schoolRating | median(6.9, 7.1, 8.2) | 7.10 |

`recordCount = 3`。

### 11.2 加筛选 minPrice = 200000

筛选后保留 id 2、3（2 条）：

| 字段 | 期望值 |
| --- | --- |
| squareFootage | 1635.00（(1420+1850)/2） |
| bedrooms | 3 |
| recordCount | 2 |

### 11.3 无匹配筛选 minPrice = 500000

`countByFilter = 0`，Mapper 不应被调用计算 median。

## 12. DB 验收点

1. What-if 不新增表，完全基于 `house_record`。
2. Baseline 查询 include `DashboardFilter`，与 Dashboard / Segments 筛选语义一致。
3. `countByFilter` 与 `selectBaselineFeatures` 使用相同筛选条件。
4. 7 个特征列 median 算法与精度符合第 4 节。
5. 筛选后无数据时不在 DB 层返回空 `HouseFeaturesVO` 冒充有效 Baseline，由 Service 返回业务错误。
6. 场景预测接口不依赖本库新增 SQL。
7. 所有动态条件使用 MyBatis `#{}` 绑定；列名白名单使用 `${}` 时不得来自用户输入。
8. 第 11 节验证用例在 Mapper 集成测试中通过。
