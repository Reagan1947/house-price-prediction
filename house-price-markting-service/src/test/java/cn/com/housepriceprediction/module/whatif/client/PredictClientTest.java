package cn.com.housepriceprediction.module.whatif.client;

import cn.com.housepriceprediction.common.exception.BusinessException;
import cn.com.housepriceprediction.common.response.RespCode;
import cn.com.housepriceprediction.module.whatif.entity.vo.HouseFeaturesVO;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.net.SocketTimeoutException;
import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class PredictClientTest {

	private static final String PREDICT_URL = "http://127.0.0.1/api/v1/predict";

	@Test
	void shouldSendSnakeCaseBodyForSinglePredict() {
		RestClient.Builder builder = RestClient.builder();
		MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
		server.expect(requestTo(PREDICT_URL))
				.andExpect(content().contentType(MediaType.APPLICATION_JSON))
				.andExpect(content().string(containsString("\"square_footage\":1280")))
				.andExpect(content().string(containsString("\"year_built\":2014")))
				.andRespond(withSuccess("""
						{"code":200,"msg":"ok","data":{"mode":"single","count":1,"prediction":283958.8637,"predictions":[283958.8637]}}
						""", MediaType.APPLICATION_JSON));
		PredictClient client = client(builder);

		BigDecimal price = client.predictSingle(sampleFeatures());

		assertEquals(new BigDecimal("283958.86"), price);
		server.verify();
	}

	@Test
	void shouldSendJsonArrayForBatchPredict() throws Exception {
		RestClient.Builder builder = RestClient.builder();
		MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
		server.expect(requestTo(PREDICT_URL))
				.andRespond(withSuccess("""
						{"code":200,"msg":"ok","data":{"mode":"batch","count":2,"predictions":[315420.501,298100.004]}}
						""", MediaType.APPLICATION_JSON));
		PredictClient client = client(builder);

		List<BigDecimal> prices = client.predictBatch(List.of(sampleFeatures(), sampleFeatures()));

		assertEquals(2, prices.size());
		assertEquals(new BigDecimal("315420.50"), prices.get(0));
		assertEquals(new BigDecimal("298100.00"), prices.get(1));
		server.verify();
	}

	@Test
	void shouldRejectBatchOverLimit() {
		PredictClient client = client(RestClient.builder());
		List<HouseFeaturesVO> oversized = java.util.stream.Stream.generate(this::sampleFeatures)
				.limit(51)
				.toList();
		BusinessException ex = assertThrows(BusinessException.class, () -> client.predictBatch(oversized));
		assertEquals(RespCode.ERROR_PARAMETER.getCode(), ex.getCode());
	}

	@Test
	void shouldFailOnUnprocessableEntity() {
		RestClient.Builder builder = RestClient.builder();
		MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
		server.expect(requestTo(PREDICT_URL)).andRespond(withStatus(HttpStatus.UNPROCESSABLE_ENTITY));
		PredictClient client = client(builder);

		assertThrows(BusinessException.class, () -> client.predictSingle(sampleFeatures()));
		server.verify();
	}

	@Test
	void shouldFailWhenPredictServiceUnavailable() {
		RestClient.Builder builder = RestClient.builder();
		MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
		server.expect(requestTo(PREDICT_URL)).andRespond(withException(new SocketTimeoutException("timeout")));
		PredictClient client = client(builder);

		BusinessException ex = assertThrows(BusinessException.class, () -> client.predictSingle(sampleFeatures()));
		assertEquals(RespCode.ERROR_OPERATION.getCode(), ex.getCode());
		server.verify();
	}

	private PredictClient client(RestClient.Builder builder) {
		return new PredictClient(builder.build(), PREDICT_URL, 50);
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
}
