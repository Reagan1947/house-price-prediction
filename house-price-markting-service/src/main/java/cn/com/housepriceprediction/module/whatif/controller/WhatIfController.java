package cn.com.housepriceprediction.module.whatif.controller;

import cn.com.housepriceprediction.common.response.BaseResponse;
import cn.com.housepriceprediction.common.response.Result;
import cn.com.housepriceprediction.module.dashboard.client.AuthVerifyClient;
import cn.com.housepriceprediction.module.whatif.entity.request.ScenarioPredictRequest;
import cn.com.housepriceprediction.module.whatif.entity.request.WhatIfBaselineQueryRequest;
import cn.com.housepriceprediction.module.whatif.entity.vo.BaselineVO;
import cn.com.housepriceprediction.module.whatif.entity.vo.ScenarioPredictVO;
import cn.com.housepriceprediction.module.whatif.service.WhatIfService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

/**
 * What-if 场景分析接口
 */
@RestController
@RequestMapping("/what-if")
@RequiredArgsConstructor
public class WhatIfController {

	private final AuthVerifyClient authVerifyClient;
	private final WhatIfService whatIfService;

	@PostMapping("/baseline")
	public BaseResponse<BaselineVO> baseline(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@RequestBody(required = false) WhatIfBaselineQueryRequest body,
			@ModelAttribute WhatIfBaselineQueryRequest queryParams) {
		authVerifyClient.verify(authorization);
		WhatIfBaselineQueryRequest request = resolve(body, queryParams);
		return Result.success(whatIfService.baseline(request));
	}

	@PostMapping("/scenarios/predict")
	public BaseResponse<ScenarioPredictVO> scenarioPredict(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@RequestBody ScenarioPredictRequest request) {
		authVerifyClient.verify(authorization);
		return Result.success(whatIfService.scenarioPredict(request));
	}

	private static WhatIfBaselineQueryRequest resolve(WhatIfBaselineQueryRequest body,
													   WhatIfBaselineQueryRequest queryParams) {
		return Optional.ofNullable(body)
				.orElseGet(WhatIfBaselineQueryRequest::new)
				.resolve(queryParams);
	}
}
