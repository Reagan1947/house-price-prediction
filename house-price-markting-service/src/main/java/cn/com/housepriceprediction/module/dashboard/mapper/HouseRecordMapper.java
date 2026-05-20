package cn.com.housepriceprediction.module.dashboard.mapper;

import cn.com.housepriceprediction.module.dashboard.entity.DO.HouseRecord;
import cn.com.housepriceprediction.module.dashboard.entity.request.DashboardQueryRequest;
import cn.com.housepriceprediction.module.dashboard.entity.vo.DashboardMetricsVO;
import cn.com.housepriceprediction.module.dashboard.entity.vo.PriceDistributionPointVO;
import cn.com.housepriceprediction.module.dashboard.entity.vo.PriceSquareScatterPointVO;
import cn.com.housepriceprediction.module.dashboard.entity.vo.PriceYearTrendPointVO;
import cn.com.housepriceprediction.module.segment.entity.enums.SegmentDimension;
import cn.com.housepriceprediction.module.segment.entity.request.SegmentQueryRequest;
import cn.com.housepriceprediction.module.segment.entity.vo.SegmentChartPointVO;
import cn.com.housepriceprediction.module.segment.entity.vo.SegmentGroupRowVO;
import cn.com.housepriceprediction.module.whatif.entity.request.WhatIfBaselineQueryRequest;
import cn.com.housepriceprediction.module.whatif.entity.vo.HouseFeaturesVO;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;

import java.math.BigDecimal;
import java.util.List;

/**
 * 房屋记录 Mapper
 */
public interface HouseRecordMapper extends BaseMapper<HouseRecord> {

	DashboardMetricsVO selectMetrics(@Param("request") DashboardQueryRequest request);

	BigDecimal selectMedianPrice(@Param("request") DashboardQueryRequest request);

	List<PriceDistributionPointVO> selectPriceDistribution(@Param("request") DashboardQueryRequest request,
														   @Param("bucketCount") Integer bucketCount);

	List<PriceSquareScatterPointVO> selectPriceSquareScatter(@Param("request") DashboardQueryRequest request,
															 @Param("limit") Integer limit);

	List<PriceYearTrendPointVO> selectPriceYearTrend(@Param("request") DashboardQueryRequest request);

	List<SegmentGroupRowVO> selectSegmentTableGroups(@Param("request") SegmentQueryRequest request,
													 @Param("dimension") SegmentDimension dimension);

	List<SegmentChartPointVO> selectSegmentChartGroups(@Param("request") SegmentQueryRequest request,
													   @Param("dimension") SegmentDimension dimension);

	Long countByFilter(@Param("request") WhatIfBaselineQueryRequest request);

	HouseFeaturesVO selectBaselineFeatures(@Param("request") WhatIfBaselineQueryRequest request);
}
