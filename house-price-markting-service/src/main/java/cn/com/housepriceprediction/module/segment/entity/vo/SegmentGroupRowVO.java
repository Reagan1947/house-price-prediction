package cn.com.housepriceprediction.module.segment.entity.vo;

import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;

/**
 * Segments 聚合表行
 */
@Data
@Accessors(chain = true)
public class SegmentGroupRowVO implements Serializable {

	private String group;

	private String groupKey;

	private Long count;

	private BigDecimal median;

	private BigDecimal mean;

	private BigDecimal p25;

	private BigDecimal p75;

	private BigDecimal stdDev;

	@Serial
	private static final long serialVersionUID = 1L;
}
