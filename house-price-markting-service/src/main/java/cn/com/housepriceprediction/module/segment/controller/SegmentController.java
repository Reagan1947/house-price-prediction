package cn.com.housepriceprediction.module.segment.controller;

import cn.com.housepriceprediction.common.response.BaseResponse;
import cn.com.housepriceprediction.common.response.Result;
import cn.com.housepriceprediction.module.dashboard.client.AuthVerifyClient;
import cn.com.housepriceprediction.module.segment.entity.request.SegmentQueryRequest;
import cn.com.housepriceprediction.module.segment.entity.vo.SegmentChartVO;
import cn.com.housepriceprediction.module.segment.entity.vo.SegmentTableVO;
import cn.com.housepriceprediction.module.segment.service.SegmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

/**
 * Segments 分析接口
 */
@RestController
@RequestMapping("/segments")
@RequiredArgsConstructor
public class SegmentController {

	private final AuthVerifyClient authVerifyClient;
	private final SegmentService segmentService;

	@PostMapping("/table")
	public BaseResponse<SegmentTableVO> table(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@RequestBody(required = false) SegmentQueryRequest body,
			@ModelAttribute SegmentQueryRequest queryParams) {
		authVerifyClient.verify(authorization);
		SegmentQueryRequest request = resolve(body, queryParams);
		return Result.success(segmentService.table(request));
	}

	@PostMapping("/chart")
	public BaseResponse<SegmentChartVO> chart(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@RequestBody(required = false) SegmentQueryRequest body,
			@ModelAttribute SegmentQueryRequest queryParams) {
		authVerifyClient.verify(authorization);
		SegmentQueryRequest request = resolve(body, queryParams);
		return Result.success(segmentService.chart(request));
	}

	private static SegmentQueryRequest resolve(SegmentQueryRequest body, SegmentQueryRequest queryParams) {
		return Optional.ofNullable(body)
				.orElseGet(SegmentQueryRequest::new)
				.resolve(queryParams);
	}
}
