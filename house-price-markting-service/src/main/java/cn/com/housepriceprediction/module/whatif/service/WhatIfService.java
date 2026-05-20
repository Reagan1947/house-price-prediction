package cn.com.housepriceprediction.module.whatif.service;

import cn.com.housepriceprediction.module.whatif.entity.request.ScenarioPredictRequest;
import cn.com.housepriceprediction.module.whatif.entity.request.WhatIfBaselineQueryRequest;
import cn.com.housepriceprediction.module.whatif.entity.vo.BaselineVO;
import cn.com.housepriceprediction.module.whatif.entity.vo.ScenarioPredictVO;

/**
 * What-if 分析 Service
 */
public interface WhatIfService {

	BaselineVO baseline(WhatIfBaselineQueryRequest request);

	ScenarioPredictVO scenarioPredict(ScenarioPredictRequest request);
}
