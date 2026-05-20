package cn.com.housepriceprediction.module.segment.controller;

import cn.com.housepriceprediction.common.exception.BusinessException;
import cn.com.housepriceprediction.common.exception.GlobalExceptionHandler;
import cn.com.housepriceprediction.common.response.RespCode;
import cn.com.housepriceprediction.module.dashboard.client.AuthVerifyClient;
import cn.com.housepriceprediction.module.dashboard.entity.dto.AuthUserDTO;
import cn.com.housepriceprediction.module.segment.entity.request.SegmentQueryRequest;
import cn.com.housepriceprediction.module.segment.entity.vo.SegmentChartVO;
import cn.com.housepriceprediction.module.segment.entity.vo.SegmentTableVO;
import cn.com.housepriceprediction.module.segment.service.SegmentService;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SegmentControllerTest {

	@Test
	void shouldNotCallTableServiceWhenAuthorizationMissing() throws Exception {
		AtomicInteger serviceCalls = new AtomicInteger();
		MockMvc mockMvc = mockMvc(authClient(null, new BusinessException(RespCode.NOT_LOGIN, "认证失败")),
				stub(serviceCalls));

		mockMvc.perform(post("/segments/table")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"segmentDimension\":\"bedrooms\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value(RespCode.NOT_LOGIN.getCode()));

		assertEquals(0, serviceCalls.get());
	}

	@Test
	void shouldNotCallChartServiceWhenAuthorizationMissing() throws Exception {
		AtomicInteger serviceCalls = new AtomicInteger();
		MockMvc mockMvc = mockMvc(authClient(null, new BusinessException(RespCode.NOT_LOGIN, "认证失败")),
				stub(serviceCalls));

		mockMvc.perform(post("/segments/chart")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"segmentDimension\":\"bedrooms\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value(RespCode.NOT_LOGIN.getCode()));

		assertEquals(0, serviceCalls.get());
	}

	@Test
	void shouldReturnTableWhenTokenValid() throws Exception {
		AtomicInteger tableCalls = new AtomicInteger();
		MockMvc mockMvc = mockMvc(authClient("Bearer valid", null), new SegmentService() {
			@Override
			public SegmentTableVO table(SegmentQueryRequest request) {
				tableCalls.incrementAndGet();
				return SegmentTableVO.of("bedrooms", java.util.Collections.emptyList());
			}

			@Override
			public SegmentChartVO chart(SegmentQueryRequest request) {
				return SegmentChartVO.of("bedrooms", java.util.Collections.emptyList());
			}
		});

		mockMvc.perform(post("/segments/table")
						.header("Authorization", "Bearer valid")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"segmentDimension\":\"bedrooms\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value(0))
				.andExpect(jsonPath("$.data.segmentDimension").value("bedrooms"));

		assertEquals(1, tableCalls.get());
	}

	@Test
	void shouldReturnChartWhenTokenValid() throws Exception {
		AtomicInteger chartCalls = new AtomicInteger();
		MockMvc mockMvc = mockMvc(authClient("Bearer valid", null), new SegmentService() {
			@Override
			public SegmentTableVO table(SegmentQueryRequest request) {
				return SegmentTableVO.of("bedrooms", java.util.Collections.emptyList());
			}

			@Override
			public SegmentChartVO chart(SegmentQueryRequest request) {
				chartCalls.incrementAndGet();
				return SegmentChartVO.of("bedrooms", java.util.Collections.emptyList());
			}
		});

		mockMvc.perform(post("/segments/chart")
						.header("Authorization", "Bearer valid")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"segmentDimension\":\"bedrooms\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value(0))
				.andExpect(jsonPath("$.data.segmentDimension").value("bedrooms"));

		assertEquals(1, chartCalls.get());
	}

	private SegmentService stub(AtomicInteger serviceCalls) {
		return new SegmentService() {
			@Override
			public SegmentTableVO table(SegmentQueryRequest request) {
				serviceCalls.incrementAndGet();
				return SegmentTableVO.of("bedrooms", java.util.Collections.emptyList());
			}

			@Override
			public SegmentChartVO chart(SegmentQueryRequest request) {
				serviceCalls.incrementAndGet();
				return SegmentChartVO.of("bedrooms", java.util.Collections.emptyList());
			}
		};
	}

	private MockMvc mockMvc(AuthVerifyClient authVerifyClient, SegmentService segmentService) {
		return MockMvcBuilders.standaloneSetup(new SegmentController(authVerifyClient, segmentService))
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
