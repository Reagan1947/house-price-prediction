package cn.com.housepriceprediction.module.whatif.entity.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * prediction-service 响应包装
 */
@Data
public class PredictResponse implements Serializable {

	private Integer code;

	private String msg;

	private PredictDataDTO data;

	@Serial
	private static final long serialVersionUID = 1L;
}
