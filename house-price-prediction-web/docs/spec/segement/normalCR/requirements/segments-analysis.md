# Segments-analysis

## 1.1 Summary

// TBD

## 1.2 Details

### 1.2.1 Segements 分析

Segments 分析是将数据按照维度进行分组比对, 用户可选择 (单选) 以下维度进行数据 group by

`bedrooms` / `bathrooms` / `year_built_decade` / `school_rating_band` / `distance_band`

聚合以后通过聚合表展示 (每行为一个分组) 列:`Group` / `Count` / `Median` / `Mean` / `P25` / `P75` / `Std Dev`。
表头可排序(`aria-sort`),数值列右对齐 tabular-nums。

另外需呈现可视化数据图表, 同分组的可视化(双轴条形图:左轴 Count、右轴 Median Price)。
