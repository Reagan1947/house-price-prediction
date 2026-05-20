package cn.com.housepriceprediction.module.dashboard.entity.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 价格分布点
 */
@Data
public class PriceDistributionPointVO implements Serializable {

	private BigDecimal bucketStart;

	private BigDecimal bucketEnd;

	private String label;

	private Long count;

	@Serial
	private static final long serialVersionUID = 1L;
}
