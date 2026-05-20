package cn.com.housepriceprediction.controller;

import cn.com.housepriceprediction.common.response.BaseResponse;
import cn.com.housepriceprediction.common.response.RespCode;
import cn.com.housepriceprediction.common.response.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 测试
 *
 * @author Silas Yan 2025-04-24 22:43
 */
@RestController
@RequestMapping("/test")
public class TestController {

	@GetMapping("/1")
	public BaseResponse<String> test1() {
		return Result.success("SUCCESS");
	}

	@GetMapping("/2")
	public BaseResponse<?> test2() {
		return Result.failed(RespCode.FAILED);
	}
}
