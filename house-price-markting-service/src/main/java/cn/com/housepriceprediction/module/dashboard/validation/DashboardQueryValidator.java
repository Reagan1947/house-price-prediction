package cn.com.housepriceprediction.module.dashboard.validation;

import cn.com.housepriceprediction.common.exception.BusinessException;
import cn.com.housepriceprediction.common.response.RespCode;
import cn.com.housepriceprediction.module.dashboard.entity.request.DashboardQueryRequest;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Year;

/**
 * Dashboard / Segments 区间筛选参数校验
 */
@Component
public class DashboardQueryValidator {

	private static final int MIN_YEAR_BUILT = 1800;
	private static final BigDecimal ZERO = BigDecimal.ZERO;
	private static final BigDecimal TEN = BigDecimal.TEN;

	/**
	 * 校验 Min/Max 区间筛选字段（Segments 与 Dashboard 共用）
	 */
	public void validateFilters(DashboardQueryRequest query) {
		validateLongRange("id", query.getMinId(), query.getMaxId(), 1L, null);
		validateBigDecimalRange("squareFootage", query.getMinSquareFootage(), query.getMaxSquareFootage(),
				ZERO, null, false, true);
		validateIntegerRange("bedrooms", query.getMinBedrooms(), query.getMaxBedrooms(), 0, null);
		validateBigDecimalRange("bathrooms", query.getMinBathrooms(), query.getMaxBathrooms(),
				ZERO, null, true, true);
		validateIntegerRange("yearBuilt", query.getMinYearBuilt(), query.getMaxYearBuilt(),
				MIN_YEAR_BUILT, Year.now().getValue());
		validateBigDecimalRange("lotSize", query.getMinLotSize(), query.getMaxLotSize(),
				ZERO, null, false, true);
		validateBigDecimalRange("distanceToCityCenter", query.getMinDistanceToCityCenter(),
				query.getMaxDistanceToCityCenter(), ZERO, null, true, true);
		validateBigDecimalRange("schoolRating", query.getMinSchoolRating(), query.getMaxSchoolRating(),
				ZERO, TEN, true, true);
		validateBigDecimalRange("price", query.getMinPrice(), query.getMaxPrice(), ZERO, null, true, true);
	}

	/**
	 * Dashboard 专用：在区间筛选基础上校验 priceBucketCount、scatterLimit
	 */
	public void validateDashboard(DashboardQueryRequest query) {
		validateFilters(query);
		validateIntegerRange("priceBucketCount", query.getPriceBucketCount(), query.getPriceBucketCount(), 1, 50);
		validateIntegerRange("scatterLimit", query.getScatterLimit(), query.getScatterLimit(), 1, 5000);
	}

	private void validateLongRange(String field, Long min, Long max, Long minAllowed, Long maxAllowed) {
		if (min != null && minAllowed != null && min < minAllowed) {
			throw parameterError(field + " 最小值非法");
		}
		if (max != null && minAllowed != null && max < minAllowed) {
			throw parameterError(field + " 最大值非法");
		}
		if (min != null && maxAllowed != null && min > maxAllowed) {
			throw parameterError(field + " 最小值非法");
		}
		if (max != null && maxAllowed != null && max > maxAllowed) {
			throw parameterError(field + " 最大值非法");
		}
		if (min != null && max != null && min > max) {
			throw parameterError(field + " 最小值不能大于最大值");
		}
	}

	private void validateIntegerRange(String field, Integer min, Integer max, Integer minAllowed, Integer maxAllowed) {
		if (min != null && minAllowed != null && min < minAllowed) {
			throw parameterError(field + " 最小值非法");
		}
		if (max != null && minAllowed != null && max < minAllowed) {
			throw parameterError(field + " 最大值非法");
		}
		if (min != null && maxAllowed != null && min > maxAllowed) {
			throw parameterError(field + " 最小值非法");
		}
		if (max != null && maxAllowed != null && max > maxAllowed) {
			throw parameterError(field + " 最大值非法");
		}
		if (min != null && max != null && min > max) {
			throw parameterError(field + " 最小值不能大于最大值");
		}
	}

	private void validateBigDecimalRange(String field, BigDecimal min, BigDecimal max, BigDecimal minAllowed,
										 BigDecimal maxAllowed, boolean includeMin, boolean includeMax) {
		validateBigDecimalBound(field + " 最小值非法", min, minAllowed, true, includeMin);
		validateBigDecimalBound(field + " 最大值非法", max, minAllowed, true, includeMin);
		validateBigDecimalBound(field + " 最小值非法", min, maxAllowed, false, includeMax);
		validateBigDecimalBound(field + " 最大值非法", max, maxAllowed, false, includeMax);
		if (min != null && max != null && min.compareTo(max) > 0) {
			throw parameterError(field + " 最小值不能大于最大值");
		}
	}

	private void validateBigDecimalBound(String message, BigDecimal value, BigDecimal bound,
										 boolean lowerBound, boolean includeBound) {
		if (value == null || bound == null) {
			return;
		}
		int compare = value.compareTo(bound);
		boolean invalid = lowerBound
				? (includeBound ? compare < 0 : compare <= 0)
				: (includeBound ? compare > 0 : compare >= 0);
		if (invalid) {
			throw parameterError(message);
		}
	}

	private BusinessException parameterError(String message) {
		return new BusinessException(RespCode.ERROR_PARAMETER, message);
	}
}
