package cn.com.housepriceprediction.module.dashboard.entity.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 价格与面积散点图点
 */
@Data
public class PriceSquareScatterPointVO implements Serializable {

	private BigDecimal squareFootage;

	private BigDecimal price;

	@Serial
	private static final long serialVersionUID = 1L;
}
