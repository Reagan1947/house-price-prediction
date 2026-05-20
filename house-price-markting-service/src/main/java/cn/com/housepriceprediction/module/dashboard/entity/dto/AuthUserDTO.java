package cn.com.housepriceprediction.module.dashboard.entity.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 外部认证用户信息
 */
@Data
public class AuthUserDTO implements Serializable {

	private Boolean valid;

	@JsonProperty("user_id")
	private Long userId;

	private String username;

	private String email;

	@Serial
	private static final long serialVersionUID = 1L;
}
