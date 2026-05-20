package cn.com.housepriceprediction.module.segment.entity.vo;

import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;

/**
 * Segments 图表数据点
 */
@Data
@Accessors(chain = true)
public class SegmentChartPointVO implements Serializable {

	private String group;

	private String groupKey;

	private Long count;

	private BigDecimal medianPrice;

	@Serial
	private static final long serialVersionUID = 1L;
}
