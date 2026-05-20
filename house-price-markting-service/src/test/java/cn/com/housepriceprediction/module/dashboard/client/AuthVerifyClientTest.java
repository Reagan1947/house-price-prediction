package cn.com.housepriceprediction.module.dashboard.client;

import cn.com.housepriceprediction.common.exception.BusinessException;
import cn.com.housepriceprediction.module.dashboard.entity.dto.AuthUserDTO;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.net.SocketTimeoutException;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class AuthVerifyClientTest {

	private static final String VERIFY_URL = "http://127.0.0.1/api/v1/auth/verify";

	@Test
	void shouldRejectMissingAuthorization() {
		RestClient.Builder builder = RestClient.builder();
		MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
		AuthVerifyClient client = client(builder);

		assertThrows(BusinessException.class, () -> client.verify(null));
		server.verify();
	}

	@Test
	void shouldRejectNonBearerAuthorization() {
		RestClient.Builder builder = RestClient.builder();
		MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
		AuthVerifyClient client = client(builder);

		assertThrows(BusinessException.class, () -> client.verify("Token abc"));
		server.verify();
	}

	@Test
	void shouldReturnUserWhenExternalAuthIsValid() {
		RestClient.Builder builder = RestClient.builder();
		MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
		server.expect(requestTo(VERIFY_URL))
				.andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer abc"))
				.andRespond(withSuccess("""
						{"code":200,"msg":"Request succeeded","data":{"valid":true,"user_id":1,"username":"admin","email":"admin@example.com"}}
						""", org.springframework.http.MediaType.APPLICATION_JSON));
		AuthVerifyClient client = client(builder);

		AuthUserDTO user = client.verify("Bearer abc");

		assertEquals(1L, user.getUserId());
		assertEquals("admin", user.getUsername());
		server.verify();
	}

	@Test
	void shouldRejectUnauthorizedResponse() {
		RestClient.Builder builder = RestClient.builder();
		MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
		server.expect(requestTo(VERIFY_URL)).andRespond(withStatus(HttpStatus.UNAUTHORIZED));
		AuthVerifyClient client = client(builder);

		assertThrows(BusinessException.class, () -> client.verify("Bearer abc"));
		server.verify();
	}

	@Test
	void shouldRejectInvalidResponseBody() {
		RestClient.Builder builder = RestClient.builder();
		MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
		server.expect(requestTo(VERIFY_URL))
				.andRespond(withSuccess("""
						{"code":200,"msg":"Request succeeded","data":{"valid":false}}
						""", org.springframework.http.MediaType.APPLICATION_JSON));
		AuthVerifyClient client = client(builder);

		assertThrows(BusinessException.class, () -> client.verify("Bearer abc"));
		server.verify();
	}

	@Test
	void shouldFailWhenExternalAuthServiceUnavailable() {
		RestClient.Builder builder = RestClient.builder();
		MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
		server.expect(requestTo(VERIFY_URL)).andRespond(withException(new SocketTimeoutException("timeout")));
		AuthVerifyClient client = client(builder);

		assertThrows(BusinessException.class, () -> client.verify("Bearer abc"));
		server.verify();
	}

	private AuthVerifyClient client(RestClient.Builder builder) {
		return new AuthVerifyClient(builder.build(), VERIFY_URL);
	}
}
