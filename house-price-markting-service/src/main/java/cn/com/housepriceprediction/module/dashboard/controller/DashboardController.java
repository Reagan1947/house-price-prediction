package cn.com.housepriceprediction.module.dashboard.controller;

import cn.com.housepriceprediction.common.response.BaseResponse;
import cn.com.housepriceprediction.common.response.Result;
import cn.com.housepriceprediction.module.dashboard.client.AuthVerifyClient;
import cn.com.housepriceprediction.module.dashboard.entity.request.DashboardQueryRequest;
import cn.com.housepriceprediction.module.dashboard.entity.vo.DashboardVO;
import cn.com.housepriceprediction.module.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

/**
 * Analysis Dashboard 接口
 */
@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

	private final AuthVerifyClient authVerifyClient;
	private final DashboardService dashboardService;

	@PostMapping
	public BaseResponse<DashboardVO> dashboard(@RequestHeader(value = "Authorization", required = false) String authorization,
											   @RequestBody(required = false) DashboardQueryRequest body,
											   @ModelAttribute DashboardQueryRequest queryParams) {
		authVerifyClient.verify(authorization);
		DashboardQueryRequest request = Optional.ofNullable(body)
				.orElseGet(DashboardQueryRequest::new)
				.resolve(queryParams);
		return Result.success(dashboardService.dashboard(request));
	}
}
