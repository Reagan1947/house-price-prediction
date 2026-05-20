package cn.com.housepriceprediction.module.whatif.service;

import cn.com.housepriceprediction.common.exception.BusinessException;
import cn.com.housepriceprediction.common.response.RespCode;
import cn.com.housepriceprediction.module.dashboard.mapper.HouseRecordMapper;
import cn.com.housepriceprediction.module.dashboard.validation.DashboardQueryValidator;
import cn.com.housepriceprediction.module.whatif.client.PredictClient;
import cn.com.housepriceprediction.module.whatif.client.PredictClientStub;
import cn.com.housepriceprediction.module.whatif.entity.request.ScenarioPredictRequest;
import cn.com.housepriceprediction.module.whatif.entity.request.WhatIfBaselineQueryRequest;
import cn.com.housepriceprediction.module.whatif.entity.vo.BaselineVO;
import cn.com.housepriceprediction.module.whatif.entity.vo.HouseFeaturesVO;
import cn.com.housepriceprediction.module.whatif.entity.vo.ScenarioPredictVO;
import cn.com.housepriceprediction.module.whatif.service.impl.WhatIfServiceImpl;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class WhatIfServiceImplTest {

	@Test
	void shouldReturnBaselineWhenDataExists() {
		HouseFeaturesVO features = sampleFeatures();
		AtomicInteger predictCalls = new AtomicInteger();
		WhatIfServiceImpl service = service(
				mapperStub(5L, features),
				predictStub(predictCalls, new BigDecimal("283958.86")));

		BaselineVO baseline = service.baseline(new WhatIfBaselineQueryRequest());

		assertEquals(5L, baseline.getRecordCount());
		assertEquals(features, baseline.getFeatures());
		assertEquals(new BigDecimal("283958.86"), baseline.getBaselinePredictedPrice());
		assertEquals(1, predictCalls.get());
	}

	@Test
	void shouldRejectBaselineWhenNoRecords() {
		AtomicInteger predictCalls = new AtomicInteger();
		WhatIfServiceImpl service = service(
				mapperStub(0L, null),
				predictStub(predictCalls, BigDecimal.ZERO));

		BusinessException ex = assertThrows(BusinessException.class,
				() -> service.baseline(new WhatIfBaselineQueryRequest()));
		assertEquals(RespCode.ERROR_OPERATION.getCode(), ex.getCode());
		assertEquals(0, predictCalls.get());
	}

	@Test
	void shouldRejectInvalidFilterRange() {
		WhatIfBaselineQueryRequest request = new WhatIfBaselineQueryRequest();
		request.setMinBedrooms(4);
		request.setMaxBedrooms(2);
		WhatIfServiceImpl service = service(
				mapperStub(5L, sampleFeatures()),
				predictStub(new AtomicInteger(), BigDecimal.ONE));

		assertThrows(BusinessException.class, () -> service.baseline(request));
	}

	@Test
	void shouldPredictSingleScenario() {
		AtomicInteger predictCalls = new AtomicInteger();
		WhatIfServiceImpl service = service(
				mapperStub(0L, null),
				predictStub(predictCalls, new BigDecimal("315420.50")));

		ScenarioPredictRequest request = new ScenarioPredictRequest();
		request.setFeatures(sampleFeatures());

		ScenarioPredictVO result = service.scenarioPredict(request);

		assertEquals("single", result.getMode());
		assertEquals(1, result.getCount());
		assertEquals(new BigDecimal("315420.50"), result.getPredictedPrice());
		assertEquals(List.of(new BigDecimal("315420.50")), result.getPredictions());
		assertEquals(1, predictCalls.get());
	}

	@Test
	void shouldPredictBatchScenarioInOrder() {
		WhatIfServiceImpl service = service(
				mapperStub(0L, null),
				new PredictClientStub(featuresList -> List.of(new BigDecimal("100.00"), new BigDecimal("200.00")), true));

		ScenarioPredictRequest request = new ScenarioPredictRequest();
		request.setFeaturesList(List.of(sampleFeatures(), sampleFeatures()));

		ScenarioPredictVO result = service.scenarioPredict(request);

		assertEquals("batch", result.getMode());
		assertEquals(2, result.getCount());
		assertEquals(List.of(new BigDecimal("100.00"), new BigDecimal("200.00")), result.getPredictions());
	}

	@Test
	void shouldRejectScenarioRequestWithoutFeatures() {
		WhatIfServiceImpl service = service(
				mapperStub(0L, null),
				predictStub(new AtomicInteger(), BigDecimal.ONE));

		assertThrows(BusinessException.class, () -> service.scenarioPredict(new ScenarioPredictRequest()));
	}

	@Test
	void shouldRejectScenarioRequestWithBothFeaturesAndList() {
		ScenarioPredictRequest request = new ScenarioPredictRequest();
		request.setFeatures(sampleFeatures());
		request.setFeaturesList(List.of(sampleFeatures()));
		WhatIfServiceImpl service = service(
				mapperStub(0L, null),
				predictStub(new AtomicInteger(), BigDecimal.ONE));

		assertThrows(BusinessException.class, () -> service.scenarioPredict(request));
	}

	@Test
	void shouldRejectInvalidSchoolRating() {
		HouseFeaturesVO features = sampleFeatures().setSchoolRating(new BigDecimal("11"));
		ScenarioPredictRequest request = new ScenarioPredictRequest();
		request.setFeatures(features);
		WhatIfServiceImpl service = service(
				mapperStub(0L, null),
				predictStub(new AtomicInteger(), BigDecimal.ONE));

		assertThrows(BusinessException.class, () -> service.scenarioPredict(request));
	}

	private WhatIfServiceImpl service(HouseRecordMapper mapper, PredictClient predictClient) {
		return new WhatIfServiceImpl(mapper, new DashboardQueryValidator(), predictClient);
	}

	private HouseRecordMapper mapperStub(Long count, HouseFeaturesVO features) {
		return (HouseRecordMapper) Proxy.newProxyInstance(
				HouseRecordMapper.class.getClassLoader(),
				new Class[]{HouseRecordMapper.class},
				(proxy, method, args) -> {
					if ("countByFilter".equals(method.getName())) {
						return count;
					}
					if ("selectBaselineFeatures".equals(method.getName())) {
						return features;
					}
					return defaultValue(method.getReturnType());
				});
	}

	private PredictClient predictStub(AtomicInteger predictCalls, BigDecimal price) {
		return new PredictClientStub(features -> {
			predictCalls.incrementAndGet();
			return price;
		});
	}

	private HouseFeaturesVO sampleFeatures() {
		return new HouseFeaturesVO()
				.setSquareFootage(new BigDecimal("1280"))
				.setBedrooms(3)
				.setBathrooms(new BigDecimal("2.0"))
				.setYearBuilt(2014)
				.setLotSize(new BigDecimal("3200"))
				.setDistanceToCityCenter(new BigDecimal("7.8"))
				.setSchoolRating(new BigDecimal("8.4"));
	}

	private static Object defaultValue(Class<?> returnType) {
		if (!returnType.isPrimitive()) {
			return null;
		}
		if (returnType == boolean.class) {
			return false;
		}
		if (returnType == byte.class) {
			return (byte) 0;
		}
		if (returnType == short.class) {
			return (short) 0;
		}
		if (returnType == int.class) {
			return 0;
		}
		if (returnType == long.class) {
			return 0L;
		}
		if (returnType == float.class) {
			return 0F;
		}
		if (returnType == double.class) {
			return 0D;
		}
		return 0;
	}
}
