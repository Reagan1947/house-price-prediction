# Segments 分析 DB 设计

## 1. 数据库设计目标

Segments 分析在 Dashboard 共用的房屋明细表 `house_record` 上，先按 Min / Max 区间筛选，再按用户选择的维度分组，计算每组价格统计指标。本设计定义：

1. 复用的表结构与筛选 SQL（与 Dashboard 一致）。
2. 五种分组维度的分桶表达式。
3. Table / Chart 两条聚合查询 SQL 及 Mapper 约定。

**不新增业务表。** 表结构详见 `docs/spec/dashboard/normalCR/db-design/dashboard-db-design.md`。

## 2. 数据表依赖

### 2.1 表：house_record

Segments 查询依赖字段：

| 字段 | 类型 | Segments 用途 |
| --- | --- | --- |
| id | BIGINT | 筛选、排序 |
| square_footage | DECIMAL(12,2) | 区间筛选 |
| bedrooms | INT | 筛选；`bedrooms` 维度分组 |
| bathrooms | DECIMAL(3,1) | 筛选；`bathrooms` 维度分组 |
| year_built | INT | 筛选；`year_built_decade` 维度分组 |
| lot_size | DECIMAL(12,2) | 区间筛选 |
| distance_to_city_center | DECIMAL(10,2) | 筛选；`distance_band` 维度分组 |
| school_rating | DECIMAL(4,2) | 筛选；`school_rating_band` 维度分组 |
| price | DECIMAL(14,2) | 聚合统计目标列 |

### 2.2 索引

复用 Dashboard 已有索引：

| 索引 | 字段 |
| --- | --- |
| PRIMARY | id |
| idx_price | price |
| idx_square_footage | square_footage |
| idx_year_built | year_built |
| idx_bedrooms | bedrooms |
| idx_bathrooms | bathrooms |

**可选优化（数据量增大时评估）：**

```sql
CREATE INDEX idx_distance_to_city_center ON house_record (distance_to_city_center ASC);
CREATE INDEX idx_school_rating ON house_record (school_rating ASC);
```

Segments 按 `distance_band`、`school_rating_band` 分组时，上述索引有助于筛选后的分组聚合。

## 3. 公共筛选 SQL

Segments 与 Dashboard **必须**复用 `HouseRecordMapper.xml` 中已有片段：

| 片段 ID | 用途 |
| --- | --- |
| `DashboardFilter` | 无表别名查询 |
| `DashboardFilterAlias` | 带 `${alias}` 的子查询 |

请求对象类型为 `SegmentQueryRequest`，MyBatis 中 `request` 属性需包含与 `DashboardQueryRequest` 相同的 Min / Max 字段（继承或组合均可），以保证 `<if test="request.minBedrooms != null">` 等条件生效。

筛选逻辑与 Dashboard 文档第 6 节一致，不在此重复列出全部条件。

## 4. 分组维度 SQL 片段

建议在 `HouseRecordMapper.xml` 新增 `<sql id="SegmentGroupExprs">`，通过 `dimension` 参数切换：

```xml
<sql id="SegmentGroupExprs">
    <choose>
        <when test="dimension.name() == 'BEDROOMS'">
            CAST(bedrooms AS CHAR) AS group_key,
            CAST(bedrooms AS CHAR) AS group_label
        </when>
        <when test="dimension.name() == 'BATHROOMS'">
            CAST(bathrooms AS CHAR) AS group_key,
            CAST(bathrooms AS CHAR) AS group_label
        </when>
        <when test="dimension.name() == 'YEAR_BUILT_DECADE'">
            CAST(FLOOR(year_built / 10) * 10 AS CHAR) AS group_key,
            CONCAT(FLOOR(year_built / 10) * 10, 's') AS group_label
        </when>
        <when test="dimension.name() == 'SCHOOL_RATING_BAND'">
            CAST(FLOOR(school_rating / 2) * 2 AS CHAR) AS group_key,
            CONCAT(
                FLOOR(school_rating / 2) * 2,
                '-',
                LEAST(FLOOR(school_rating / 2) * 2 + 2, 10)
            ) AS group_label
        </when>
        <when test="dimension.name() == 'DISTANCE_BAND'">
            CAST(FLOOR(distance_to_city_center / 2) * 2 AS CHAR) AS group_key,
            CASE
                WHEN FLOOR(distance_to_city_center / 2) * 2 &gt;= 10
                    THEN CONCAT(FLOOR(distance_to_city_center / 2) * 2, '+')
                ELSE CONCAT(
                    FLOOR(distance_to_city_center / 2) * 2,
                    '-',
                    FLOOR(distance_to_city_center / 2) * 2 + 2
                )
            END AS group_label
        </when>
    </choose>
</sql>
```

### 4.1 分桶规则说明

| dimension | group_key 示例 | group_label 示例 | 规则 |
| --- | --- | --- | --- |
| bedrooms | `2` | `2` | 原值 |
| bathrooms | `1.5` | `1.5` | 原值 |
| year_built_decade | `1980` | `1980s` | 1980–1989 |
| school_rating_band | `6` | `6-8` | \[6, 8)，评分封顶 10 |
| distance_band | `2` | `2-4` | \[2, 4) 英里；下界 ≥10 为 `10+` |

示例：`year_built=1985` → `1980s`；`school_rating=7.1` → `6-8`；`distance=10.5` → `10+`。

## 5. 分组聚合公共 CTE

Table 与 Chart 共用下列 CTE 结构（可在 XML 中定义为 `SegmentGroupedBase` 供 include）：

```sql
WITH filtered AS (
    SELECT
        <include SegmentGroupExprs />,
        price
    FROM house_record
    <include refid="DashboardFilter"/>
),
ranked AS (
    SELECT
        group_key,
        group_label,
        price,
        ROW_NUMBER() OVER (PARTITION BY group_key ORDER BY price) AS rn,
        COUNT(*) OVER (PARTITION BY group_key) AS cnt
    FROM filtered
),
percentiles AS (
    SELECT
        group_key,
        group_label,
        cnt AS count,
        ROUND(AVG(price), 2) AS mean,
        ROUND(COALESCE(STDDEV_POP(price), 0), 2) AS std_dev,
        ROUND(AVG(CASE WHEN rn IN (
            FLOOR((cnt + 1) / 2), FLOOR((cnt + 2) / 2)
        ) THEN price END), 2) AS median,
        ROUND(MAX(CASE WHEN rn = GREATEST(1, CEIL(cnt * 0.25)) THEN price END), 2) AS p25,
        ROUND(MAX(CASE WHEN rn = GREATEST(1, CEIL(cnt * 0.75)) THEN price END), 2) AS p75
    FROM ranked
    GROUP BY group_key, group_label, cnt
)
```

**单条分组（cnt = 1）：** `median = mean = p25 = p75 = price`，`std_dev = 0`。

## 6. Table 查询 SQL

### 6.1 Mapper 方法

```java
List<SegmentGroupRowVO> selectSegmentTableGroups(
        @Param("request") SegmentQueryRequest request,
        @Param("dimension") SegmentDimension dimension);
```

### 6.2 完整查询

```sql
-- 基于第 5 节 CTE，最终 SELECT：
SELECT
    group_label AS `group`,
    group_key   AS groupKey,
    count,
    median,
    mean,
    p25,
    p75,
    std_dev     AS stdDev
FROM percentiles
ORDER BY CAST(group_key AS DECIMAL(20, 4)) ASC, group_key ASC;
```

### 6.3 结果映射 SegmentGroupRowVO

| 列别名 | Java 字段 | 类型 |
| --- | --- | --- |
| group | group | String |
| groupKey | groupKey | String |
| count | count | Long |
| median | median | BigDecimal |
| mean | mean | BigDecimal |
| p25 | p25 | BigDecimal |
| p75 | p75 | BigDecimal |
| stdDev | stdDev | BigDecimal |

## 7. Chart 查询 SQL

### 7.1 Mapper 方法

```java
List<SegmentChartPointVO> selectSegmentChartGroups(
        @Param("request") SegmentQueryRequest request,
        @Param("dimension") SegmentDimension dimension);
```

### 7.2 完整查询

复用第 5 节相同 CTE，最终仅投影图表字段：

```sql
SELECT
    group_label AS `group`,
    group_key   AS groupKey,
    count,
    median      AS medianPrice
FROM percentiles
ORDER BY CAST(group_key AS DECIMAL(20, 4)) ASC, group_key ASC;
```

### 7.3 结果映射 SegmentChartPointVO

| 列别名 | Java 字段 | 类型 |
| --- | --- | --- |
| group | group | String |
| groupKey | groupKey | String |
| count | count | Long |
| medianPrice | medianPrice | BigDecimal |

**与 Table 一致性：** 相同 `request` + `dimension` 下，`groupKey`、`count`、`medianPrice` 分别等于 Table 对应行的 `groupKey`、`count`、`median`。

## 8. Mapper 文件约定

路径：`src/main/resources/mapper/HouseRecordMapper.xml`

| 元素 | 说明 |
| --- | --- |
| `DashboardFilter` | 已有，Segments 直接 include |
| `SegmentGroupExprs` | 新增，按 dimension 切换 |
| `selectSegmentTableGroups` | 新增 select |
| `selectSegmentChartGroups` | 新增 select |

Java 接口：`cn.com.housepriceprediction.module.dashboard.mapper.HouseRecordMapper`

## 9. 边界与空结果

| 场景 | DB / Service 行为 |
| --- | --- |
| 筛选后 0 行 | 不进入分组；Mapper 返回空列表 |
| 某维度无分组 | 空列表 |
| price 为 NULL | 表约束 NOT NULL；不应出现 |
| 组内 1 条 | 见 5 节单条规则 |
| bathrooms 小数 | 按 DECIMAL 原值作为 group_key |

## 10. 验证用例数据

使用 Dashboard 样例 3 条记录验证分组（无额外筛选）：

| id | bedrooms | bathrooms | year_built | distance | school_rating | price |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 2 | 1.0 | 1985 | 3.2 | 7.1 | 185000 |
| 2 | 3 | 2.0 | 1998 | 5.6 | 8.2 | 265000 |
| 3 | 3 | 2.0 | 1992 | 2.8 | 6.9 | 210000 |

### 10.1 dimension = bedrooms

| group | count | median |
| --- | --- | --- |
| 2 | 1 | 185000.00 |
| 3 | 2 | 237500.00 |

### 10.2 dimension = year_built_decade

| group | count |
| --- | --- |
| 1980s | 1 |
| 1990s | 2 |

### 10.3 加筛选 minPrice = 200000

`bedrooms` 维度仅保留 `group=3`，`count=2`。

### 10.4 Table 与 Chart 对照

同一请求下，Chart 每个 `groupKey` 的 `medianPrice` 必须等于 Table 对应行 `median`。

## 11. DB 验收点

1. Segments 不新增表，完全基于 `house_record`。
2. Table / Chart 查询均 include `DashboardFilter`，与 Dashboard 筛选语义一致。
3. 五种 `segmentDimension` 的分组标签符合第 4 节规则。
4. Table 查询返回 count、median、mean、p25、p75、stdDev。
5. Chart 查询返回 count、median（映射为 medianPrice）。
6. 相同筛选 + 维度下，Table 与 Chart 的 `groupKey` 集合及 count、中位数一致。
7. 空数据、单条分组等边界有明确 SQL/Service 处理。
8. 所有动态条件使用 MyBatis `#{}` 绑定，禁止拼接用户输入。
