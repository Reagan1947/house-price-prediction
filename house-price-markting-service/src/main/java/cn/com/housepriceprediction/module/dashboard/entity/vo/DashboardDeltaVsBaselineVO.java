package cn.com.housepriceprediction.module.dashboard.entity.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 筛选结果相对全量基准的增减百分比
 */
@Data
@Accessors(chain = true)
public class DashboardDeltaVsBaselineVO implements Serializable {

	@Schema(description = "平均价格相对全量基准的增减百分比，正数为增长、负数为下降")
	private BigDecimal avgPredictedPrice;

	@Schema(description = "价格中位数相对全量基准的增减百分比")
	private BigDecimal medianPredictedPrice;

	@Schema(description = "平均每平方英尺价格相对全量基准的增减百分比")
	private BigDecimal avgPricePerSquareFoot;

	public static DashboardDeltaVsBaselineVO zero() {
		return new DashboardDeltaVsBaselineVO()
				.setAvgPredictedPrice(BigDecimal.ZERO)
				.setMedianPredictedPrice(BigDecimal.ZERO)
				.setAvgPricePerSquareFoot(BigDecimal.ZERO);
	}

	@Serial
	private static final long serialVersionUID = 1L;
}
