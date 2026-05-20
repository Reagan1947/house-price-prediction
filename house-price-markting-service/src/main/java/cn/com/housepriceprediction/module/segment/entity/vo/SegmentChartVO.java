package cn.com.housepriceprediction.module.segment.entity.vo;

import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serial;
import java.io.Serializable;
import java.util.Collections;
import java.util.List;

/**
 * Segments 图表响应
 */
@Data
@Accessors(chain = true)
public class SegmentChartVO implements Serializable {

	private String segmentDimension;

	private List<SegmentChartPointVO> points;

	public static SegmentChartVO of(String segmentDimension, List<SegmentChartPointVO> points) {
		return new SegmentChartVO()
				.setSegmentDimension(segmentDimension)
				.setPoints(points == null ? Collections.emptyList() : points);
	}

	@Serial
	private static final long serialVersionUID = 1L;
}
