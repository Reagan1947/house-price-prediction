package cn.com.housepriceprediction.module.whatif.service.impl;

import cn.com.housepriceprediction.common.exception.BusinessException;
import cn.com.housepriceprediction.common.response.RespCode;
import cn.com.housepriceprediction.module.dashboard.mapper.HouseRecordMapper;
import cn.com.housepriceprediction.module.dashboard.validation.DashboardQueryValidator;
import cn.com.housepriceprediction.module.whatif.client.PredictClient;
import cn.com.housepriceprediction.module.whatif.entity.request.ScenarioPredictRequest;
import cn.com.housepriceprediction.module.whatif.entity.request.WhatIfBaselineQueryRequest;
import cn.com.housepriceprediction.module.whatif.entity.vo.BaselineVO;
import cn.com.housepriceprediction.module.whatif.entity.vo.HouseFeaturesVO;
import cn.com.housepriceprediction.module.whatif.entity.vo.ScenarioPredictVO;
import cn.com.housepriceprediction.module.whatif.service.WhatIfService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.math.BigDecimal;
import java.time.Year;
import java.util.List;
import java.util.Optional;

/**
 * What-if 分析 Service 实现
 */
@Service
@RequiredArgsConstructor
public class WhatIfServiceImpl implements WhatIfService {

	private static final int MIN_YEAR_BUILT = 1800;
	private static final BigDecimal ZERO = BigDecimal.ZERO;
	private static final BigDecimal TEN = BigDecimal.TEN;

	private final HouseRecordMapper houseRecordMapper;
	private final DashboardQueryValidator dashboardQueryValidator;
	private final PredictClient predictClient;

	@Override
	public BaselineVO baseline(WhatIfBaselineQueryRequest request) {
		WhatIfBaselineQueryRequest query = Optional.ofNullable(request).orElseGet(WhatIfBaselineQueryRequest::new);
		dashboardQueryValidator.validateFilters(query);

		Long recordCount = houseRecordMapper.countByFilter(query);
		if (recordCount == null || recordCount == 0) {
			throw new BusinessException(RespCode.ERROR_OPERATION, "筛选后无数据，无法计算 Baseline");
		}

		HouseFeaturesVO features = houseRecordMapper.selectBaselineFeatures(query);
		BigDecimal baselinePredictedPrice = predictClient.predictSingle(features);

		return new BaselineVO()
				.setRecordCount(recordCount)
				.setFeatures(features)
				.setBaselinePredictedPrice(baselinePredictedPrice);
	}

	@Override
	public ScenarioPredictVO scenarioPredict(ScenarioPredictRequest request) {
		if (request == null) {
			throw parameterError("场景预测请求不能为空");
		}
		boolean hasSingle = request.getFeatures() != null;
		boolean hasBatch = !CollectionUtils.isEmpty(request.getFeaturesList());
		if (hasSingle == hasBatch) {
			throw parameterError("features 与 featuresList 必须且只能提供一个");
		}

		if (hasSingle) {
			validateFeatures(request.getFeatures());
			BigDecimal price = predictClient.predictSingle(request.getFeatures());
			return new ScenarioPredictVO()
					.setMode("single")
					.setCount(1)
					.setPredictedPrice(price)
					.setPredictions(List.of(price));
		}

		List<HouseFeaturesVO> featuresList = request.getFeaturesList();
		for (HouseFeaturesVO features : featuresList) {
			validateFeatures(features);
		}
		List<BigDecimal> predictions = predictClient.predictBatch(featuresList);
		return new ScenarioPredictVO()
				.setMode("batch")
				.setCount(predictions.size())
				.setPredictions(predictions);
	}

	private void validateFeatures(HouseFeaturesVO features) {
		if (features == null) {
			throw parameterError("场景特征不能为空");
		}
		validatePositive("squareFootage", features.getSquareFootage(), false);
		validateNonNegativeInteger("bedrooms", features.getBedrooms());
		validateNonNegative("bathrooms", features.getBathrooms());
		validateYearBuilt(features.getYearBuilt());
		validatePositive("lotSize", features.getLotSize(), false);
		validateNonNegative("distanceToCityCenter", features.getDistanceToCityCenter());
		validateSchoolRating(features.getSchoolRating());
	}

	private void validatePositive(String field, BigDecimal value, boolean allowZero) {
		if (value == null) {
			throw parameterError(field + " 不能为空");
		}
		int compare = value.compareTo(ZERO);
		if (allowZero ? compare < 0 : compare <= 0) {
			throw parameterError(field + " 非法");
		}
	}

	private void validateNonNegative(String field, BigDecimal value) {
		if (value == null) {
			throw parameterError(field + " 不能为空");
		}
		if (value.compareTo(ZERO) < 0) {
			throw parameterError(field + " 非法");
		}
	}

	private void validateNonNegativeInteger(String field, Integer value) {
		if (value == null) {
			throw parameterError(field + " 不能为空");
		}
		if (value < 0) {
			throw parameterError(field + " 非法");
		}
	}

	private void validateYearBuilt(Integer yearBuilt) {
		if (yearBuilt == null) {
			throw parameterError("yearBuilt 不能为空");
		}
		int currentYear = Year.now().getValue();
		if (yearBuilt < MIN_YEAR_BUILT || yearBuilt > currentYear) {
			throw parameterError("yearBuilt 非法");
		}
	}

	private void validateSchoolRating(BigDecimal schoolRating) {
		if (schoolRating == null) {
			throw parameterError("schoolRating 不能为空");
		}
		if (schoolRating.compareTo(ZERO) < 0 || schoolRating.compareTo(TEN) > 0) {
			throw parameterError("schoolRating 非法");
		}
	}

	private BusinessException parameterError(String message) {
		return new BusinessException(RespCode.ERROR_PARAMETER, message);
	}
}
