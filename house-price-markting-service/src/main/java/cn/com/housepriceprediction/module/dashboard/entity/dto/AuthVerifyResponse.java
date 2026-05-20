package cn.com.housepriceprediction.module.dashboard.entity.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 外部 Token 校验响应
 */
@Data
public class AuthVerifyResponse implements Serializable {

	private Integer code;

	private String msg;

	private AuthUserDTO data;

	@Serial
	private static final long serialVersionUID = 1L;
}
