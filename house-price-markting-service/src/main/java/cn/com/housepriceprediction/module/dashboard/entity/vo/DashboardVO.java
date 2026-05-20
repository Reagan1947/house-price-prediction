package cn.com.housepriceprediction.module.dashboard.entity.vo;

import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serial;
import java.io.Serializable;
import java.util.Collections;
import java.util.List;

/**
 * Dashboard 聚合响应
 */
@Data
@Accessors(chain = true)
public class DashboardVO implements Serializable {

	private DashboardMetricsVO metrics;

	private List<PriceDistributionPointVO> priceDistribution;

	private List<PriceSquareScatterPointVO> priceSquareScatter;

	private List<PriceYearTrendPointVO> priceYearTrend;

	public static DashboardVO empty() {
		return new DashboardVO()
				.setMetrics(DashboardMetricsVO.empty())
				.setPriceDistribution(Collections.emptyList())
				.setPriceSquareScatter(Collections.emptyList())
				.setPriceYearTrend(Collections.emptyList());
	}

	@Serial
	private static final long serialVersionUID = 1L;
}
