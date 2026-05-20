package cn.com.housepriceprediction.module.dashboard.controller;

import cn.com.housepriceprediction.common.exception.BusinessException;
import cn.com.housepriceprediction.common.exception.GlobalExceptionHandler;
import cn.com.housepriceprediction.common.response.RespCode;
import cn.com.housepriceprediction.module.dashboard.client.AuthVerifyClient;
import cn.com.housepriceprediction.module.dashboard.entity.dto.AuthUserDTO;
import cn.com.housepriceprediction.module.dashboard.entity.request.DashboardQueryRequest;
import cn.com.housepriceprediction.module.dashboard.entity.vo.DashboardVO;
import cn.com.housepriceprediction.module.dashboard.service.DashboardService;
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

class DashboardControllerTest {

	@Test
	void shouldNotCallServiceWhenAuthorizationMissing() throws Exception {
		AtomicInteger serviceCalls = new AtomicInteger();
		MockMvc mockMvc = mockMvc(authClient(null, new BusinessException(RespCode.NOT_LOGIN, "认证失败")),
				request -> {
					serviceCalls.incrementAndGet();
					return DashboardVO.empty();
				});

		mockMvc.perform(post("/dashboard")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value(RespCode.NOT_LOGIN.getCode()));

		assertEquals(0, serviceCalls.get());
	}

	@Test
	void shouldNotCallServiceWhenTokenInvalid() throws Exception {
		AtomicInteger serviceCalls = new AtomicInteger();
		MockMvc mockMvc = mockMvc(authClient("Bearer invalid", new BusinessException(RespCode.NOT_LOGIN, "认证失败")),
				request -> {
					serviceCalls.incrementAndGet();
					return DashboardVO.empty();
				});

		mockMvc.perform(post("/dashboard")
						.header("Authorization", "Bearer invalid")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value(RespCode.NOT_LOGIN.getCode()));

		assertEquals(0, serviceCalls.get());
	}

	@Test
	void shouldReturnDashboardWhenTokenValid() throws Exception {
		AtomicInteger serviceCalls = new AtomicInteger();
		MockMvc mockMvc = mockMvc(authClient("Bearer valid", null), request -> {
			serviceCalls.incrementAndGet();
			return DashboardVO.empty();
		});

		mockMvc.perform(post("/dashboard")
						.header("Authorization", "Bearer valid")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value(0))
				.andExpect(jsonPath("$.data.metrics.totalRecords").value(0));

		assertEquals(1, serviceCalls.get());
	}

	private MockMvc mockMvc(AuthVerifyClient authVerifyClient, DashboardService dashboardService) {
		return MockMvcBuilders.standaloneSetup(new DashboardController(authVerifyClient, dashboardService))
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

	@FunctionalInterface
	private interface DashboardServiceStub extends DashboardService {

		@Override
		DashboardVO dashboard(DashboardQueryRequest request);
	}
}
