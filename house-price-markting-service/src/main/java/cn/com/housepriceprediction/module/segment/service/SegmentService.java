package cn.com.housepriceprediction.module.segment.service;

import cn.com.housepriceprediction.module.segment.entity.request.SegmentQueryRequest;
import cn.com.housepriceprediction.module.segment.entity.vo.SegmentChartVO;
import cn.com.housepriceprediction.module.segment.entity.vo.SegmentTableVO;

/**
 * Segments 分析 Service
 */
public interface SegmentService {

	SegmentTableVO table(SegmentQueryRequest request);

	SegmentChartVO chart(SegmentQueryRequest request);
}
