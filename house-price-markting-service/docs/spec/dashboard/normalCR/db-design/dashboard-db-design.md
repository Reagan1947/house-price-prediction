# Analysis Dashboard DB 设计

## 1. 数据库设计目标

Dashboard 依赖房屋明细数据进行实时筛选和聚合。本设计定义房屋记录表、索引、DO 字段映射以及 Dashboard 统计查询 SQL。

## 2. 数据表设计

表名：`house_record`

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | 房屋记录 ID |
| square_footage | DECIMAL(12,2) | NOT NULL | 房屋面积，单位 Sq.Ft |
| bedrooms | INT | NOT NULL | 卧室数量 |
| bathrooms | DECIMAL(3,1) | NOT NULL | 浴室数量 |
| year_built | INT | NOT NULL | 建造年份 |
| lot_size | DECIMAL(12,2) | NOT NULL | 土地面积 |
| distance_to_city_center | DECIMAL(10,2) | NOT NULL | 距离市中心距离 |
| school_rating | DECIMAL(4,2) | NOT NULL | 学校评分 |
| price | DECIMAL(14,2) | NOT NULL | 房屋价格 |
| create_time | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

## 3. 索引设计

| 索引 | 字段 | 说明 |
| --- | --- | --- |
| PRIMARY | id | 主键查询和稳定排序 |
| idx_price | price | 支持价格筛选、分布统计、中位数 |
| idx_square_footage | square_footage | 支持面积筛选和散点图 |
| idx_year_built | year_built | 支持年份筛选和趋势图 |
| idx_bedrooms | bedrooms | 支持卧室数量筛选 |
| idx_bathrooms | bathrooms | 支持浴室数量筛选 |

## 4. 建表 SQL

```sql
CREATE TABLE house_record
(
    id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    square_footage          DECIMAL(12, 2)  NOT NULL COMMENT '房屋面积，单位Sq.Ft',
    bedrooms                INT             NOT NULL COMMENT '卧室数量',
    bathrooms               DECIMAL(3, 1)   NOT NULL COMMENT '浴室数量',
    year_built              INT             NOT NULL COMMENT '建造年份',
    lot_size                DECIMAL(12, 2)  NOT NULL COMMENT '土地面积',
    distance_to_city_center DECIMAL(10, 2)  NOT NULL COMMENT '距离市中心距离',
    school_rating           DECIMAL(4, 2)   NOT NULL COMMENT '学校评分',
    price                   DECIMAL(14, 2)  NOT NULL COMMENT '房屋价格',
    create_time             DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time             DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id) USING BTREE,
    INDEX idx_price (price ASC) USING BTREE,
    INDEX idx_square_footage (square_footage ASC) USING BTREE,
    INDEX idx_year_built (year_built ASC) USING BTREE,
    INDEX idx_bedrooms (bedrooms ASC) USING BTREE,
    INDEX idx_bathrooms (bathrooms ASC) USING BTREE
) ENGINE = InnoDB
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci COMMENT = '房屋记录表'
  ROW_FORMAT = DYNAMIC;
```

## 5. DO 字段映射

路径：`src/main/java/cn/com/housepriceprediction/module/dashboard/entity/DO/HouseRecord.java`

| Java 字段 | 类型 | DB 字段 |
| --- | --- | --- |
| id | Long | id |
| squareFootage | BigDecimal | square_footage |
| bedrooms | Integer | bedrooms |
| bathrooms | BigDecimal | bathrooms |
| yearBuilt | Integer | year_built |
| lotSize | BigDecimal | lot_size |
| distanceToCityCenter | BigDecimal | distance_to_city_center |
| schoolRating | BigDecimal | school_rating |
| price | BigDecimal | price |
| createTime | Date | create_time |
| updateTime | Date | update_time |

金额、面积、距离、评分均使用 `BigDecimal`，避免浮点误差影响统计结果。

## 6. 公共筛选 SQL

建议在 `src/main/resources/mapper/HouseRecordMapper.xml` 中定义公共 `<sql id="DashboardFilter">`，所有统计查询复用同一份筛选逻辑。

```xml
<sql id="DashboardFilter">
    <where>
        <if test="request.minId != null">AND id &gt;= #{request.minId}</if>
        <if test="request.maxId != null">AND id &lt;= #{request.maxId}</if>
        <if test="request.minSquareFootage != null">AND square_footage &gt;= #{request.minSquareFootage}</if>
        <if test="request.maxSquareFootage != null">AND square_footage &lt;= #{request.maxSquareFootage}</if>
        <if test="request.minBedrooms != null">AND bedrooms &gt;= #{request.minBedrooms}</if>
        <if test="request.maxBedrooms != null">AND bedrooms &lt;= #{request.maxBedrooms}</if>
        <if test="request.minBathrooms != null">AND bathrooms &gt;= #{request.minBathrooms}</if>
        <if test="request.maxBathrooms != null">AND bathrooms &lt;= #{request.maxBathrooms}</if>
        <if test="request.minYearBuilt != null">AND year_built &gt;= #{request.minYearBuilt}</if>
        <if test="request.maxYearBuilt != null">AND year_built &lt;= #{request.maxYearBuilt}</if>
        <if test="request.minLotSize != null">AND lot_size &gt;= #{request.minLotSize}</if>
        <if test="request.maxLotSize != null">AND lot_size &lt;= #{request.maxLotSize}</if>
        <if test="request.minDistanceToCityCenter != null">AND distance_to_city_center &gt;= #{request.minDistanceToCityCenter}</if>
        <if test="request.maxDistanceToCityCenter != null">AND distance_to_city_center &lt;= #{request.maxDistanceToCityCenter}</if>
        <if test="request.minSchoolRating != null">AND school_rating &gt;= #{request.minSchoolRating}</if>
        <if test="request.maxSchoolRating != null">AND school_rating &lt;= #{request.maxSchoolRating}</if>
        <if test="request.minPrice != null">AND price &gt;= #{request.minPrice}</if>
        <if test="request.maxPrice != null">AND price &lt;= #{request.maxPrice}</if>
    </where>
</sql>
```

如价格分布 SQL 使用表别名，需要提供带别名版本的公共筛选片段，避免字段引用歧义。

## 7. 统计查询 SQL

### 7.1 数值指标

```sql
SELECT COUNT(*) AS totalRecords,
       ROUND(COALESCE(AVG(price), 0), 2) AS avgPrice,
       ROUND(COALESCE(AVG(price / NULLIF(square_footage, 0)), 0), 2) AS avgPricePerSqFt
FROM house_record
/* include DashboardFilter */
```

说明：

1. `avgPricePerSqFt` 采用每条记录的 `price / square_footage` 后求平均。
2. 使用 `NULLIF(square_footage, 0)` 避免除零错误。
3. 空结果时聚合值返回 0。

### 7.2 中位数

MySQL 8 可使用窗口函数：

```sql
SELECT ROUND(COALESCE(AVG(price), 0), 2) AS medianPrice
FROM (
    SELECT price,
           ROW_NUMBER() OVER (ORDER BY price) AS row_num,
           COUNT(*) OVER () AS total_count
    FROM house_record
    /* include DashboardFilter */
) t
WHERE row_num IN (FLOOR((total_count + 1) / 2), FLOOR((total_count + 2) / 2));
```

说明：

1. 奇数条记录返回中间价格。
2. 偶数条记录返回中间两个价格平均值。
3. 空结果返回 0。

### 7.3 价格分布

价格分布需要先计算筛选后 `min(price)` 和 `max(price)`，再按 `priceBucketCount` 生成区间。

```sql
WITH bounds AS (
    SELECT MIN(price) AS min_price,
           MAX(price) AS max_price
    FROM house_record
    /* include DashboardFilter */
),
bucketed AS (
    SELECT CASE
               WHEN b.max_price = b.min_price THEN 0
               WHEN h.price = b.max_price THEN #{bucketCount} - 1
               ELSE FLOOR((h.price - b.min_price) / ((b.max_price - b.min_price) / #{bucketCount}))
           END AS bucket_index,
           b.min_price,
           b.max_price
    FROM house_record h
    CROSS JOIN bounds b
    /* repeat DashboardFilter with h alias */
)
SELECT ROUND(min_price + bucket_index * ((max_price - min_price) / #{bucketCount}), 2) AS bucketStart,
       ROUND(min_price + (bucket_index + 1) * ((max_price - min_price) / #{bucketCount}), 2) AS bucketEnd,
       COUNT(*) AS count
FROM bucketed
GROUP BY bucket_index, min_price, max_price
ORDER BY bucket_index ASC;
```

实现注意：

1. 若筛选后无数据，Service 直接返回空数组。
2. 若 `min_price = max_price`，返回 1 个 bucket，`bucketStart = bucketEnd = min_price`。
3. 前端所需 `label` 在 Service 中由 `bucketStart + "-" + bucketEnd` 拼接。

### 7.4 价格与面积散点图

```sql
SELECT square_footage AS squareFootage,
       price AS price
FROM house_record
/* include DashboardFilter */
ORDER BY id ASC
LIMIT #{limit};
```

说明：

1. 默认最多返回 1000 个点。
2. 如果后续数据量较大，可改为按 ID 等距抽样或按面积分桶抽样。

### 7.5 价格与建造年份趋势图

```sql
SELECT year_built AS yearBuilt,
       ROUND(AVG(price), 2) AS avgPrice,
       COUNT(*) AS count
FROM house_record
/* include DashboardFilter */
GROUP BY year_built
ORDER BY year_built ASC;
```

## 8. 示例数据

完整初始化脚本见同目录 `dashboard-init-data.sql`，脚本来源为 `House Price Dataset.csv`，共 50 条数据。

```sql
INSERT INTO house_record
    (id, square_footage, bedrooms, bathrooms, year_built, lot_size, distance_to_city_center, school_rating, price)
VALUES
    (1, 1250, 2, 1, 1985, 5200, 3.2, 7.1, 185000),
    (2, 1850, 3, 2, 1998, 7500, 5.6, 8.2, 265000),
    (3, 1420, 3, 2, 1992, 6800, 2.8, 6.9, 210000);
```

## 9. DB 验收点

1. `house_record` 表可完整保存需求字段。
2. 主要筛选和聚合字段已建立索引。
3. 所有 Dashboard 查询复用同一套筛选条件。
4. 数值指标、中位数、价格分布、散点图、年份趋势均可由 SQL 查询得到。
5. 空数据和价格相同等边界场景有明确处理方式。
