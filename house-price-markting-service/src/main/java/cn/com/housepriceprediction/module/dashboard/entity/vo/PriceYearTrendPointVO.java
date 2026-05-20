package cn.com.housepriceprediction.module.dashboard.entity.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 价格与建造年份趋势图点
 */
@Data
public class PriceYearTrendPointVO implements Serializable {

	private Integer yearBuilt;

	private BigDecimal avgPrice;

	private Long count;

	@Serial
	private static final long serialVersionUID = 1L;
}
