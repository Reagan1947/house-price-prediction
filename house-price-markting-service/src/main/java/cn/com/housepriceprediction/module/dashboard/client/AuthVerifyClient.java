package cn.com.housepriceprediction.module.dashboard.client;

import cn.com.housepriceprediction.common.exception.BusinessException;
import cn.com.housepriceprediction.common.response.RespCode;
import cn.com.housepriceprediction.module.dashboard.entity.dto.AuthUserDTO;
import cn.com.housepriceprediction.module.dashboard.entity.dto.AuthVerifyResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;

/**
 * 外部认证服务客户端
 */
@Slf4j
@Component
public class AuthVerifyClient {

	private static final String BEARER_PREFIX = "Bearer ";

	private final RestClient restClient;
	private final String verifyUrl;

	@Autowired
	public AuthVerifyClient(RestClient.Builder restClientBuilder,
							@Value("${auth.verify-url:http://114.67.76.100:8001/api/v1/auth/verify}") String verifyUrl,
							@Value("${auth.connect-timeout:3s}") Duration connectTimeout,
							@Value("${auth.read-timeout:3s}") Duration readTimeout) {
		SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
		requestFactory.setConnectTimeout(connectTimeout);
		requestFactory.setReadTimeout(readTimeout);
		this.restClient = restClientBuilder.requestFactory(requestFactory).build();
		this.verifyUrl = verifyUrl;
	}

	AuthVerifyClient(RestClient restClient, String verifyUrl) {
		this.restClient = restClient;
		this.verifyUrl = verifyUrl;
	}

	public AuthUserDTO verify(String authorization) {
		if (!StringUtils.hasText(authorization) || !authorization.startsWith(BEARER_PREFIX)) {
			throw unauthorized();
		}
		try {
			AuthVerifyResponse response = restClient.get()
					.uri(verifyUrl)
					.header(HttpHeaders.AUTHORIZATION, authorization)
					.retrieve()
					.body(AuthVerifyResponse.class);
			if (response == null || response.getData() == null || !Boolean.TRUE.equals(response.getData().getValid())) {
				throw unauthorized();
			}
			return response.getData();
		} catch (HttpClientErrorException.Unauthorized e) {
			throw unauthorized();
		} catch (RestClientResponseException e) {
			if (HttpStatus.UNAUTHORIZED.value() == e.getStatusCode().value()) {
				throw unauthorized();
			}
			log.warn("[外部认证] 认证服务响应异常: status={}", e.getStatusCode().value());
			throw authServiceUnavailable();
		} catch (ResourceAccessException e) {
			log.warn("[外部认证] 认证服务访问异常: {}", e.getMessage());
			throw authServiceUnavailable();
		}
	}

	private BusinessException unauthorized() {
		return new BusinessException(RespCode.NOT_LOGIN, "认证失败");
	}

	private BusinessException authServiceUnavailable() {
		return new BusinessException(RespCode.ERROR_OPERATION, "认证服务不可用");
	}
}
