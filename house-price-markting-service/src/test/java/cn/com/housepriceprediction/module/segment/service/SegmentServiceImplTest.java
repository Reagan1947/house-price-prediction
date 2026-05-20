package cn.com.housepriceprediction.module.segment.service;

import cn.com.housepriceprediction.common.exception.BusinessException;
import cn.com.housepriceprediction.module.dashboard.mapper.HouseRecordMapper;
import cn.com.housepriceprediction.module.dashboard.validation.DashboardQueryValidator;
import cn.com.housepriceprediction.module.segment.entity.request.SegmentQueryRequest;
import cn.com.housepriceprediction.module.segment.entity.vo.SegmentChartPointVO;
import cn.com.housepriceprediction.module.segment.entity.vo.SegmentChartVO;
import cn.com.housepriceprediction.module.segment.entity.vo.SegmentGroupRowVO;
import cn.com.housepriceprediction.module.segment.entity.vo.SegmentTableVO;
import cn.com.housepriceprediction.module.segment.service.impl.SegmentServiceImpl;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SegmentServiceImplTest {

	@Test
	void shouldRejectMissingSegmentDimensionForTable() {
		SegmentServiceImpl segmentService = segmentService(mapperStub(invocation -> Collections.emptyList()));
		assertThrows(BusinessException.class, () -> segmentService.table(new SegmentQueryRequest()));
	}

	@Test
	void shouldRejectMissingSegmentDimensionForChart() {
		SegmentServiceImpl segmentService = segmentService(mapperStub(invocation -> Collections.emptyList()));
		assertThrows(BusinessException.class, () -> segmentService.chart(new SegmentQueryRequest()));
	}

	@Test
	void shouldRejectInvalidSegmentDimension() {
		SegmentQueryRequest request = new SegmentQueryRequest();
		request.setSegmentDimension("city");
		SegmentServiceImpl segmentService = segmentService(mapperStub(invocation -> Collections.emptyList()));
		assertThrows(BusinessException.class, () -> segmentService.table(request));
	}

	@Test
	void shouldRejectInvalidRanges() {
		assertInvalid(query -> {
			query.setSegmentDimension("bedrooms");
			query.setMinBedrooms(3);
			query.setMaxBedrooms(2);
		});
	}

	@Test
	void shouldReturnEmptyRowsWhenMapperReturnsEmpty() {
		SegmentQueryRequest request = new SegmentQueryRequest();
		request.setSegmentDimension("bedrooms");
		SegmentServiceImpl segmentService = segmentService(mapperStub(invocation -> Collections.emptyList()));

		SegmentTableVO table = segmentService.table(request);
		SegmentChartVO chart = segmentService.chart(request);

		assertEquals("bedrooms", table.getSegmentDimension());
		assertTrue(table.getRows().isEmpty());
		assertEquals("bedrooms", chart.getSegmentDimension());
		assertTrue(chart.getPoints().isEmpty());
	}

	@Test
	void shouldReturnTableAndChartData() {
		SegmentQueryRequest request = new SegmentQueryRequest();
		request.setSegmentDimension("bedrooms");
		SegmentGroupRowVO row = new SegmentGroupRowVO()
				.setGroup("2")
				.setGroupKey("2")
				.setCount(1L)
				.setMedian(new BigDecimal("185000.00"));
		SegmentChartPointVO point = new SegmentChartPointVO()
				.setGroup("2")
				.setGroupKey("2")
				.setCount(1L)
				.setMedianPrice(new BigDecimal("185000.00"));
		SegmentServiceImpl segmentService = segmentService(mapperStub(invocation -> switch (invocation.methodName()) {
			case "selectSegmentTableGroups" -> List.of(row);
			case "selectSegmentChartGroups" -> List.of(point);
			default -> Collections.emptyList();
		}));

		SegmentTableVO table = segmentService.table(request);
		SegmentChartVO chart = segmentService.chart(request);

		assertEquals(1, table.getRows().size());
		assertEquals(new BigDecimal("185000.00"), table.getRows().get(0).getMedian());
		assertEquals(1, chart.getPoints().size());
		assertEquals(new BigDecimal("185000.00"), chart.getPoints().get(0).getMedianPrice());
	}

	private void assertInvalid(Consumer<SegmentQueryRequest> consumer) {
		SegmentQueryRequest request = new SegmentQueryRequest();
		consumer.accept(request);
		SegmentServiceImpl segmentService = segmentService(mapperStub(invocation -> Collections.emptyList()));
		assertThrows(BusinessException.class, () -> segmentService.table(request));
	}

	private SegmentServiceImpl segmentService(HouseRecordMapper mapper) {
		return new SegmentServiceImpl(mapper, new DashboardQueryValidator());
	}

	private HouseRecordMapper mapperStub(InvocationHandler handler) {
		return (HouseRecordMapper) Proxy.newProxyInstance(
				HouseRecordMapper.class.getClassLoader(),
				new Class[]{HouseRecordMapper.class},
				(proxy, method, args) -> handler.handle(new Invocation(method.getName(), args))
		);
	}

	private record Invocation(String methodName, Object[] args) {
	}

	@FunctionalInterface
	private interface InvocationHandler {
		Object handle(Invocation invocation);
	}
}
