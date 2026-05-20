package cn.com.housepriceprediction.module.whatif.controller;

import cn.com.housepriceprediction.common.exception.BusinessException;
import cn.com.housepriceprediction.common.exception.GlobalExceptionHandler;
import cn.com.housepriceprediction.common.response.RespCode;
import cn.com.housepriceprediction.module.dashboard.client.AuthVerifyClient;
import cn.com.housepriceprediction.module.dashboard.entity.dto.AuthUserDTO;
import cn.com.housepriceprediction.module.whatif.entity.request.ScenarioPredictRequest;
import cn.com.housepriceprediction.module.whatif.entity.request.WhatIfBaselineQueryRequest;
import cn.com.housepriceprediction.module.whatif.entity.vo.BaselineVO;
import cn.com.housepriceprediction.module.whatif.entity.vo.HouseFeaturesVO;
import cn.com.housepriceprediction.module.whatif.entity.vo.ScenarioPredictVO;
import cn.com.housepriceprediction.module.whatif.service.WhatIfService;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class WhatIfControllerTest {

	@Test
	void shouldNotCallBaselineServiceWhenAuthorizationMissing() throws Exception {
		AtomicInteger serviceCalls = new AtomicInteger();
		MockMvc mockMvc = mockMvc(authClient(null, new BusinessException(RespCode.NOT_LOGIN, "认证失败")),
				stub(serviceCalls));

		mockMvc.perform(post("/what-if/baseline")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value(RespCode.NOT_LOGIN.getCode()));

		assertEquals(0, serviceCalls.get());
	}

	@Test
	void shouldNotCallScenarioPredictServiceWhenAuthorizationMissing() throws Exception {
		AtomicInteger serviceCalls = new AtomicInteger();
		MockMvc mockMvc = mockMvc(authClient(null, new BusinessException(RespCode.NOT_LOGIN, "认证失败")),
				stub(serviceCalls));

		mockMvc.perform(post("/what-if/scenarios/predict")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"features\":{\"squareFootage\":1280,\"bedrooms\":3,\"bathrooms\":2,\"yearBuilt\":2014,\"lotSize\":3200,\"distanceToCityCenter\":7.8,\"schoolRating\":8.4}}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value(RespCode.NOT_LOGIN.getCode()));

		assertEquals(0, serviceCalls.get());
	}

	@Test
	void shouldReturnBaselineWhenTokenValid() throws Exception {
		AtomicInteger baselineCalls = new AtomicInteger();
		MockMvc mockMvc = mockMvc(authClient("Bearer valid", null), new WhatIfService() {
			@Override
			public BaselineVO baseline(WhatIfBaselineQueryRequest request) {
				baselineCalls.incrementAndGet();
				return new BaselineVO()
						.setRecordCount(3L)
						.setFeatures(new HouseFeaturesVO().setBedrooms(3))
						.setBaselinePredictedPrice(new BigDecimal("283958.86"));
			}

			@Override
			public ScenarioPredictVO scenarioPredict(ScenarioPredictRequest request) {
				return null;
			}
		});

		mockMvc.perform(post("/what-if/baseline")
						.header("Authorization", "Bearer valid")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"minBedrooms\":2}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value(0))
				.andExpect(jsonPath("$.data.recordCount").value(3))
				.andExpect(jsonPath("$.data.baselinePredictedPrice").value(283958.86));

		assertEquals(1, baselineCalls.get());
	}

	@Test
	void shouldReturnScenarioPredictWhenTokenValid() throws Exception {
		AtomicInteger predictCalls = new AtomicInteger();
		MockMvc mockMvc = mockMvc(authClient("Bearer valid", null), new WhatIfService() {
			@Override
			public BaselineVO baseline(WhatIfBaselineQueryRequest request) {
				return null;
			}

			@Override
			public ScenarioPredictVO scenarioPredict(ScenarioPredictRequest request) {
				predictCalls.incrementAndGet();
				return new ScenarioPredictVO()
						.setMode("single")
						.setCount(1)
						.setPredictedPrice(new BigDecimal("315420.50"))
						.setPredictions(java.util.List.of(new BigDecimal("315420.50")));
			}
		});

		mockMvc.perform(post("/what-if/scenarios/predict")
						.header("Authorization", "Bearer valid")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"features\":{\"squareFootage\":1500,\"bedrooms\":4,\"bathrooms\":2.5,\"yearBuilt\":2018,\"lotSize\":4000,\"distanceToCityCenter\":5.0,\"schoolRating\":9.0}}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value(0))
				.andExpect(jsonPath("$.data.mode").value("single"))
				.andExpect(jsonPath("$.data.predictedPrice").value(315420.50));

		assertEquals(1, predictCalls.get());
	}

	private WhatIfService stub(AtomicInteger serviceCalls) {
		return new WhatIfService() {
			@Override
			public BaselineVO baseline(WhatIfBaselineQueryRequest request) {
				serviceCalls.incrementAndGet();
				return new BaselineVO();
			}

			@Override
			public ScenarioPredictVO scenarioPredict(ScenarioPredictRequest request) {
				serviceCalls.incrementAndGet();
				return new ScenarioPredictVO();
			}
		};
	}

	private MockMvc mockMvc(AuthVerifyClient authVerifyClient, WhatIfService whatIfService) {
		return MockMvcBuilders.standaloneSetup(new WhatIfController(authVerifyClient, whatIfService))
				.setControllerAdvice(new GlobalExceptionHandler())
				.build();
	}

	private AuthVerifyClient authClient(String expectedAuthorization, BusinessException exception) {
		return new AuthVerifyClient(RestClient.builder(), "http://127.0.0.1", Duration.ofMillis(100), Duration.ofMillis(100)) {
			@Override
			public AuthUserDTO verify(String authorization) {
				assertEquals(expectedAuthorization, authorization);
				if (exception != null) {
					throw exception;
				}
				AuthUserDTO user = new AuthUserDTO();
				user.setValid(true);
				user.setUserId(1L);
				return user;
			}
		};
	}
}
