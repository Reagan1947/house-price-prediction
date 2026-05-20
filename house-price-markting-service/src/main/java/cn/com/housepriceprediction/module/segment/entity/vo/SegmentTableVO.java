package cn.com.housepriceprediction.module.segment.entity.vo;

import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serial;
import java.io.Serializable;
import java.util.Collections;
import java.util.List;

/**
 * Segments 聚合表响应
 */
@Data
@Accessors(chain = true)
public class SegmentTableVO implements Serializable {

	private String segmentDimension;

	private List<SegmentGroupRowVO> rows;

	public static SegmentTableVO of(String segmentDimension, List<SegmentGroupRowVO> rows) {
		return new SegmentTableVO()
				.setSegmentDimension(segmentDimension)
				.setRows(rows == null ? Collections.emptyList() : rows);
	}

	@Serial
	private static final long serialVersionUID = 1L;
}
