package cn.com.housepriceprediction.module.segment.service.impl;

import cn.com.housepriceprediction.module.dashboard.mapper.HouseRecordMapper;
import cn.com.housepriceprediction.module.dashboard.validation.DashboardQueryValidator;
import cn.com.housepriceprediction.module.segment.entity.enums.SegmentDimension;
import cn.com.housepriceprediction.module.segment.entity.request.SegmentQueryRequest;
import cn.com.housepriceprediction.module.segment.entity.vo.SegmentChartPointVO;
import cn.com.housepriceprediction.module.segment.entity.vo.SegmentChartVO;
import cn.com.housepriceprediction.module.segment.entity.vo.SegmentGroupRowVO;
import cn.com.housepriceprediction.module.segment.entity.vo.SegmentTableVO;
import cn.com.housepriceprediction.module.segment.service.SegmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Segments 分析 Service 实现
 */
@Service
@RequiredArgsConstructor
public class SegmentServiceImpl implements SegmentService {

	private final HouseRecordMapper houseRecordMapper;
	private final DashboardQueryValidator dashboardQueryValidator;

	@Override
	public SegmentTableVO table(SegmentQueryRequest request) {
		SegmentQueryRequest query = prepare(request);
		List<SegmentGroupRowVO> rows = houseRecordMapper.selectSegmentTableGroups(query,
				SegmentDimension.require(query.getSegmentDimension()));
		return SegmentTableVO.of(query.getSegmentDimension(), rows);
	}

	@Override
	public SegmentChartVO chart(SegmentQueryRequest request) {
		SegmentQueryRequest query = prepare(request);
		List<SegmentChartPointVO> points = houseRecordMapper.selectSegmentChartGroups(query,
				SegmentDimension.require(query.getSegmentDimension()));
		return SegmentChartVO.of(query.getSegmentDimension(), points);
	}

	private SegmentQueryRequest prepare(SegmentQueryRequest request) {
		SegmentQueryRequest query = Optional.ofNullable(request).orElseGet(SegmentQueryRequest::new);
		SegmentDimension.require(query.getSegmentDimension());
		dashboardQueryValidator.validateFilters(query);
		return query;
	}
}
