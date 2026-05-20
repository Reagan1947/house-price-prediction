package cn.com.housepriceprediction.module.whatif.entity.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;

/**
 * What-if Baseline 响应
 */
@Data
@Accessors(chain = true)
public class BaselineVO implements Serializable {

	@Schema(description = "筛选后记录数")
	private Long recordCount;

	@Schema(description = "各特征 median 组成的 Baseline")
	private HouseFeaturesVO features;

	@Schema(description = "Baseline 特征经预测服务得到的预测价，保留 2 位小数")
	private BigDecimal baselinePredictedPrice;

	@Serial
	private static final long serialVersionUID = 1L;
}
