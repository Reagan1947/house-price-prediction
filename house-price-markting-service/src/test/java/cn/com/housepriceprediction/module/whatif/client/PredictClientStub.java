package cn.com.housepriceprediction.module.whatif.client;

import cn.com.housepriceprediction.module.whatif.entity.vo.HouseFeaturesVO;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;
import java.util.function.Function;

/**
 * 测试用 PredictClient 桩
 */
public class PredictClientStub extends PredictClient {

	private final Function<HouseFeaturesVO, BigDecimal> singleHandler;
	private final Function<List<HouseFeaturesVO>, List<BigDecimal>> batchHandler;

	public PredictClientStub(Function<HouseFeaturesVO, BigDecimal> singleHandler) {
		super(RestClient.builder().build(), "http://127.0.0.1", 50);
		this.singleHandler = singleHandler;
		this.batchHandler = null;
	}

	public PredictClientStub(Function<List<HouseFeaturesVO>, List<BigDecimal>> batchHandler, boolean batch) {
		super(RestClient.builder().build(), "http://127.0.0.1", 50);
		this.singleHandler = null;
		this.batchHandler = batchHandler;
	}

	@Override
	public BigDecimal predictSingle(HouseFeaturesVO features) {
		return singleHandler.apply(features);
	}

	@Override
	public List<BigDecimal> predictBatch(List<HouseFeaturesVO> featuresList) {
		if (batchHandler != null) {
			return batchHandler.apply(featuresList);
		}
		return super.predictBatch(featuresList);
	}
}
