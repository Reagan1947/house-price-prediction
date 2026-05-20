package cn.com.housepriceprediction.module.whatif.entity.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

/**
 * prediction-service 预测结果 data
 */
@Data
public class PredictDataDTO implements Serializable {

	private String mode;

	private Integer count;

	private Double prediction;

	private List<Double> predictions;

	@Serial
	private static final long serialVersionUID = 1L;
}
