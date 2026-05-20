package cn.com.housepriceprediction.module.whatif.entity.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

/**
 * 场景预测响应
 */
@Data
@Accessors(chain = true)
public class ScenarioPredictVO implements Serializable {

	@Schema(description = "预测模式：single 或 batch")
	private String mode;

	@Schema(description = "预测条数")
	private Integer count;

	@Schema(description = "单笔预测价格，批次时可为 null")
	private BigDecimal predictedPrice;

	@Schema(description = "预测价格列表，顺序与请求一致")
	private List<BigDecimal> predictions;

	@Serial
	private static final long serialVersionUID = 1L;
}
