package cn.com.housepriceprediction.module.dashboard.service.impl;

import cn.com.housepriceprediction.module.dashboard.entity.request.DashboardQueryRequest;
import cn.com.housepriceprediction.module.dashboard.entity.vo.DashboardDeltaVsBaselineVO;
import cn.com.housepriceprediction.module.dashboard.entity.vo.DashboardMetricsVO;
import cn.com.housepriceprediction.module.dashboard.entity.vo.DashboardVO;
import cn.com.housepriceprediction.module.dashboard.entity.vo.PriceDistributionPointVO;
import cn.com.housepriceprediction.module.dashboard.mapper.HouseRecordMapper;
import cn.com.housepriceprediction.module.dashboard.service.DashboardService;
import cn.com.housepriceprediction.module.dashboard.validation.DashboardQueryValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

/**
 * Dashboard Service 实现
 */
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

	private static final int DEFAULT_PRICE_BUCKET_COUNT = 10;
	private static final int DEFAULT_SCATTER_LIMIT = 1000;
	private static final int MIN_YEAR_BUILT = 1800;
	private static final BigDecimal ZERO = BigDecimal.ZERO;
	private static final BigDecimal HUNDRED = new BigDecimal("100");

	private final HouseRecordMapper houseRecordMapper;
	private final DashboardQueryValidator dashboardQueryValidator;

	@Override
	public DashboardVO dashboard(DashboardQueryRequest request) {
		DashboardQueryRequest query = Optional.ofNullable(request).orElseGet(DashboardQueryRequest::new);
		fillDefaultValue(query);
		dashboardQueryValidator.validateDashboard(query);

		DashboardMetricsVO metrics = houseRecordMapper.selectMetrics(query);
		if (metrics == null || metrics.getTotalRecords() == null || metrics.getTotalRecords() == 0) {
			return DashboardVO.empty();
		}

		metrics.setAvgPrice(defaultZero(metrics.getAvgPrice()));
		metrics.setAvgPricePerSqFt(defaultZero(metrics.getAvgPricePerSqFt()));
		metrics.setMedianPrice(defaultZero(houseRecordMapper.selectMedianPrice(query)));
		fillDeltaVsBaseline(metrics, query);

		List<PriceDistributionPointVO> priceDistribution =
				houseRecordMapper.selectPriceDistribution(query, query.getPriceBucketCount());
		fillDistributionLabel(priceDistribution);

		return new DashboardVO()
				.setMetrics(metrics)
				.setPriceDistribution(priceDistribution)
				.setPriceSquareScatter(houseRecordMapper.selectPriceSquareScatter(query, query.getScatterLimit()))
				.setPriceYearTrend(houseRecordMapper.selectPriceYearTrend(query));
	}

	private void fillDeltaVsBaseline(DashboardMetricsVO metrics, DashboardQueryRequest query) {
		if (!hasDataFilter(query)) {
			metrics.setDeltaVsBaseline(DashboardDeltaVsBaselineVO.zero());
			return;
		}

		DashboardQueryRequest baselineQuery = new DashboardQueryRequest();
		DashboardMetricsVO baselineMetrics = houseRecordMapper.selectMetrics(baselineQuery);
		BigDecimal baselineAvgPrice = defaultZero(baselineMetrics == null ? null : baselineMetrics.getAvgPrice());
		BigDecimal baselineAvgPricePerSqFt = defaultZero(baselineMetrics == null ? null : baselineMetrics.getAvgPricePerSqFt());
		BigDecimal baselineMedianPrice = defaultZero(houseRecordMapper.selectMedianPrice(baselineQuery));

		metrics.setDeltaVsBaseline(new DashboardDeltaVsBaselineVO()
				.setAvgPredictedPrice(deltaPercent(metrics.getAvgPrice(), baselineAvgPrice))
				.setMedianPredictedPrice(deltaPercent(metrics.getMedianPrice(), baselineMedianPrice))
				.setAvgPricePerSquareFoot(deltaPercent(metrics.getAvgPricePerSqFt(), baselineAvgPricePerSqFt)));
	}

	private boolean hasDataFilter(DashboardQueryRequest query) {
		return isEffectiveMinId(query.getMinId())
				|| query.getMaxId() != null
				|| isGreaterThanZero(query.getMinSquareFootage())
				|| query.getMaxSquareFootage() != null
				|| isGreaterThanZero(query.getMinBedrooms())
				|| query.getMaxBedrooms() != null
				|| isGreaterThanZero(query.getMinBathrooms())
				|| query.getMaxBathrooms() != null
				|| isEffectiveMinYearBuilt(query.getMinYearBuilt())
				|| query.getMaxYearBuilt() != null
				|| isGreaterThanZero(query.getMinLotSize())
				|| query.getMaxLotSize() != null
				|| isGreaterThanZero(query.getMinDistanceToCityCenter())
				|| query.getMaxDistanceToCityCenter() != null
				|| isGreaterThanZero(query.getMinSchoolRating())
				|| query.getMaxSchoolRating() != null
				|| isGreaterThanZero(query.getMinPrice())
				|| query.getMaxPrice() != null;
	}

	private boolean isEffectiveMinId(Long minId) {
		return minId != null && minId > 1L;
	}

	private boolean isEffectiveMinYearBuilt(Integer minYearBuilt) {
		return minYearBuilt != null && minYearBuilt > MIN_YEAR_BUILT;
	}

	private boolean isGreaterThanZero(BigDecimal value) {
		return value != null && value.compareTo(ZERO) > 0;
	}

	private boolean isGreaterThanZero(Integer value) {
		return value != null && value > 0;
	}

	private BigDecimal deltaPercent(BigDecimal filtered, BigDecimal baseline) {
		if (baseline.compareTo(ZERO) == 0) {
			return filtered.compareTo(ZERO) == 0 ? ZERO : null;
		}
		return defaultZero(filtered)
				.subtract(baseline)
				.multiply(HUNDRED)
				.divide(baseline, 2, RoundingMode.HALF_UP);
	}

	private void fillDefaultValue(DashboardQueryRequest query) {
		if (query.getPriceBucketCount() == null) {
			query.setPriceBucketCount(DEFAULT_PRICE_BUCKET_COUNT);
		}
		if (query.getScatterLimit() == null) {
			query.setScatterLimit(DEFAULT_SCATTER_LIMIT);
		}
	}

	private void fillDistributionLabel(List<PriceDistributionPointVO> priceDistribution) {
		if (priceDistribution == null) {
			return;
		}
		priceDistribution.forEach(point -> point.setLabel(format(point.getBucketStart()) + "-" + format(point.getBucketEnd())));
	}

	private String format(BigDecimal value) {
		return defaultZero(value).stripTrailingZeros().toPlainString();
	}

	private BigDecimal defaultZero(BigDecimal value) {
		return value == null ? BigDecimal.ZERO : value;
	}
}
