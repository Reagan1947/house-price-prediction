package cn.com.housepriceprediction.module.whatif.client;

import cn.com.housepriceprediction.common.exception.BusinessException;
import cn.com.housepriceprediction.common.response.RespCode;
import cn.com.housepriceprediction.module.whatif.entity.dto.PredictDataDTO;
import cn.com.housepriceprediction.module.whatif.entity.dto.PredictRequest;
import cn.com.housepriceprediction.module.whatif.entity.dto.PredictResponse;
import cn.com.housepriceprediction.module.whatif.entity.vo.HouseFeaturesVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * prediction-service HTTP 客户端
 */
@Slf4j
@Component
public class PredictClient {

	private static final int SUCCESS_CODE = 200;
	private static final int PRICE_SCALE = 2;

	private final RestClient restClient;
	private final String predictUrl;
	private final int batchMaxSize;

	@Autowired
	public PredictClient(RestClient.Builder restClientBuilder,
						 @Value("${prediction.predict-url:http://114.67.76.100:8001/api/v1/predict}") String predictUrl,
						 @Value("${prediction.connect-timeout:5s}") Duration connectTimeout,
						 @Value("${prediction.read-timeout:10s}") Duration readTimeout,
						 @Value("${prediction.batch-max-size:50}") int batchMaxSize) {
		SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
		requestFactory.setConnectTimeout(connectTimeout);
		requestFactory.setReadTimeout(readTimeout);
		this.restClient = restClientBuilder.requestFactory(requestFactory).build();
		this.predictUrl = predictUrl;
		this.batchMaxSize = batchMaxSize;
	}

	PredictClient(RestClient restClient, String predictUrl, int batchMaxSize) {
		this.restClient = restClient;
		this.predictUrl = predictUrl;
		this.batchMaxSize = batchMaxSize;
	}

	public int getBatchMaxSize() {
		return batchMaxSize;
	}

	public BigDecimal predictSingle(HouseFeaturesVO features) {
		List<BigDecimal> prices = predictBatch(List.of(features));
		return prices.get(0);
	}

	public List<BigDecimal> predictBatch(List<HouseFeaturesVO> featuresList) {
		if (CollectionUtils.isEmpty(featuresList)) {
			throw new BusinessException(RespCode.ERROR_PARAMETER, "场景特征列表不能为空");
		}
		if (featuresList.size() > batchMaxSize) {
			throw new BusinessException(RespCode.ERROR_PARAMETER,
					"场景特征批次数量不能超过 " + batchMaxSize);
		}
		if (featuresList.size() == 1) {
			return List.of(predictSingleInternal(featuresList.get(0)));
		}
		return predictBatchInternal(featuresList);
	}

	private BigDecimal predictSingleInternal(HouseFeaturesVO features) {
		PredictRequest request = PredictRequest.from(features);
		try {
			PredictResponse response = restClient.post()
					.uri(predictUrl)
					.contentType(MediaType.APPLICATION_JSON)
					.body(request)
					.retrieve()
					.body(PredictResponse.class);
			return extractSinglePrice(response);
		} catch (HttpClientErrorException.UnprocessableEntity e) {
			throw parameterError();
		} catch (HttpClientErrorException e) {
			if (HttpStatus.UNPROCESSABLE_ENTITY.value() == e.getStatusCode().value()) {
				throw parameterError();
			}
			log.warn("[预测服务] 响应异常: status={}", e.getStatusCode().value());
			throw predictUnavailable();
		} catch (RestClientResponseException e) {
			if (HttpStatus.UNPROCESSABLE_ENTITY.value() == e.getStatusCode().value()) {
				throw parameterError();
			}
			log.warn("[预测服务] 响应异常: status={}", e.getStatusCode().value());
			throw predictUnavailable();
		} catch (ResourceAccessException e) {
			log.warn("[预测服务] 访问异常: {}", e.getMessage());
			throw predictUnavailable();
		}
	}

	private List<BigDecimal> predictBatchInternal(List<HouseFeaturesVO> featuresList) {
		List<PredictRequest> requests = featuresList.stream()
				.map(PredictRequest::from)
				.toList();
		try {
			PredictResponse response = restClient.post()
					.uri(predictUrl)
					.contentType(MediaType.APPLICATION_JSON)
					.body(requests)
					.retrieve()
					.body(PredictResponse.class);
			return extractBatchPrices(response);
		} catch (HttpClientErrorException.UnprocessableEntity e) {
			throw parameterError();
		} catch (HttpClientErrorException e) {
			if (HttpStatus.UNPROCESSABLE_ENTITY.value() == e.getStatusCode().value()) {
				throw parameterError();
			}
			log.warn("[预测服务] 响应异常: status={}", e.getStatusCode().value());
			throw predictUnavailable();
		} catch (RestClientResponseException e) {
			if (HttpStatus.UNPROCESSABLE_ENTITY.value() == e.getStatusCode().value()) {
				throw parameterError();
			}
			log.warn("[预测服务] 响应异常: status={}", e.getStatusCode().value());
			throw predictUnavailable();
		} catch (ResourceAccessException e) {
			log.warn("[预测服务] 访问异常: {}", e.getMessage());
			throw predictUnavailable();
		}
	}

	private BigDecimal extractSinglePrice(PredictResponse response) {
		PredictDataDTO data = requireData(response);
		if (data.getPrediction() != null) {
			return roundPrice(data.getPrediction());
		}
		if (!CollectionUtils.isEmpty(data.getPredictions())) {
			return roundPrice(data.getPredictions().get(0));
		}
		throw predictUnavailable();
	}

	private List<BigDecimal> extractBatchPrices(PredictResponse response) {
		PredictDataDTO data = requireData(response);
		if (CollectionUtils.isEmpty(data.getPredictions())) {
			throw predictUnavailable();
		}
		List<BigDecimal> prices = new ArrayList<>(data.getPredictions().size());
		for (Double value : data.getPredictions()) {
			if (value == null) {
				throw predictUnavailable();
			}
			prices.add(roundPrice(value));
		}
		return prices;
	}

	private PredictDataDTO requireData(PredictResponse response) {
		if (response == null || !Integer.valueOf(SUCCESS_CODE).equals(response.getCode()) || response.getData() == null) {
			throw predictUnavailable();
		}
		return response.getData();
	}

	private BigDecimal roundPrice(Double value) {
		return BigDecimal.valueOf(value).setScale(PRICE_SCALE, RoundingMode.HALF_UP);
	}

	private BusinessException predictUnavailable() {
		return new BusinessException(RespCode.ERROR_OPERATION, "预测服务不可用");
	}

	private BusinessException parameterError() {
		return new BusinessException(RespCode.ERROR_PARAMETER, "预测参数错误");
	}
}
