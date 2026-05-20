package cn.com.housepriceprediction.module.dashboard.entity.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;

/**
 * Dashboard 数值指标
 */
@Data
@Accessors(chain = true)
public class DashboardMetricsVO implements Serializable {

	private Long totalRecords;

	private BigDecimal avgPrice;

	private BigDecimal medianPrice;

	private BigDecimal avgPricePerSqFt;

	@Schema(description = "筛选结果相对全量基准的增减百分比")
	private DashboardDeltaVsBaselineVO deltaVsBaseline;

	public static DashboardMetricsVO empty() {
		return new DashboardMetricsVO()
				.setTotalRecords(0L)
				.setAvgPrice(BigDecimal.ZERO)
				.setMedianPrice(BigDecimal.ZERO)
				.setAvgPricePerSqFt(BigDecimal.ZERO)
				.setDeltaVsBaseline(DashboardDeltaVsBaselineVO.zero());
	}

	@Serial
	private static final long serialVersionUID = 1L;
}
