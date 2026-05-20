package cn.com.housepriceprediction.module.segment.entity.enums;

import cn.com.housepriceprediction.common.exception.BusinessException;
import cn.com.housepriceprediction.common.response.RespCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;

/**
 * Segments 分组维度
 */
@Getter
@RequiredArgsConstructor
public enum SegmentDimension {

	BEDROOMS("bedrooms"),
	BATHROOMS("bathrooms"),
	YEAR_BUILT_DECADE("year_built_decade"),
	SCHOOL_RATING_BAND("school_rating_band"),
	DISTANCE_BAND("distance_band");

	private final String apiValue;

	public static SegmentDimension fromApiValue(String apiValue) {
		if (apiValue == null || apiValue.isBlank()) {
			return null;
		}
		return Arrays.stream(values())
				.filter(dimension -> dimension.apiValue.equals(apiValue))
				.findFirst()
				.orElse(null);
	}

	public static SegmentDimension require(String apiValue) {
		SegmentDimension dimension = fromApiValue(apiValue);
		if (dimension == null) {
			throw new BusinessException(RespCode.ERROR_PARAMETER, "segmentDimension 非法");
		}
		return dimension;
	}
}
