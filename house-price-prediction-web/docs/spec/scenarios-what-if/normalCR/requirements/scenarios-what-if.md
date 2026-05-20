# Scenarios-what-if

## 1.1 Summary

// TBD

## 1.2 Details

### 1.2.1 Baseline

 基准线为 What-if 分析提供了基准, 计算思路是

 Step 1：按当前 filter 过滤数据集
从 housing 数据集中找出满足条件的记录集合 S。

Step 2：对每个特征分别求 median
例如：

- median(square_footage over S)
- median(bedrooms over S)
- median(bathrooms over S)
- median(year_built over S)
- median(lot_size over S)
- median(distance_to_city_center over S)
- median(school_rating over S)

Step 3：拼成一个 HouseFeatures
得到：

```Json
{
  "square_footage": 128,
  "bedrooms": 3,
  "bathrooms": 2,
  "year_built": 2014,
  "lot_size": 320,
  "distance_to_city_center": 7.8,
  "school_rating": 8.4
}
```

这个对象就是 baseline。

### 1.2.2 Scenarios 分析

可以依靠 prediction-service 的预测接口

| 项目 | 内容 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/api/v1/predict` |
| Summary | `房价预测（支持单笔与批次）` |
| Content-Type | `application/json` |
| Response | `ResponseModel` |

完成用户设定场景下的价格预测

### 1.2.3 和 baseline 的对比

前端计算和 baseline 的差异
