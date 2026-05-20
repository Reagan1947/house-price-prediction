package cn.com.housepriceprediction.module.dashboard.service;

import cn.com.housepriceprediction.common.exception.BusinessException;
import cn.com.housepriceprediction.module.dashboard.entity.request.DashboardQueryRequest;
import cn.com.housepriceprediction.module.dashboard.entity.vo.DashboardMetricsVO;
import cn.com.housepriceprediction.module.dashboard.entity.vo.DashboardVO;
import cn.com.housepriceprediction.module.dashboard.entity.vo.PriceDistributionPointVO;
import cn.com.housepriceprediction.module.dashboard.mapper.HouseRecordMapper;
import cn.com.housepriceprediction.module.dashboard.service.impl.DashboardServiceImpl;
import cn.com.housepriceprediction.module.dashboard.validation.DashboardQueryValidator;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DashboardServiceImplTest {

	@Test
	void shouldFillDefaultValuesForEmptyRequest() {
		DashboardQueryRequest request = new DashboardQueryRequest();
		AtomicReference<DashboardQueryRequest> capturedRequest = new AtomicReference<>();
		DashboardServiceImpl dashboardService = dashboardService(mapperStub(invocation -> {
			if ("selectMetrics".equals(invocation.methodName())) {
				capturedRequest.set((DashboardQueryRequest) invocation.args()[0]);
				return DashboardMetricsVO.empty();
			}
			return null;
		}));

		DashboardVO result = dashboardService.dashboard(request);

		assertEquals(10, request.getPriceBucketCount());
		assertEquals(1000, request.getScatterLimit());
		assertEquals(request, capturedRequest.get());
		assertEquals(0L, result.getMetrics().getTotalRecords());
	}

	@Test
	void shouldRejectInvalidRanges() {
		assertInvalid(query -> {
			query.setMinId(2L);
			query.setMaxId(1L);
		});
		assertInvalid(query -> {
			query.setMinSquareFootage(BigDecimal.TEN);
			query.setMaxSquareFootage(BigDecimal.ONE);
		});
		assertInvalid(query -> {
			query.setMinBedrooms(3);
			query.setMaxBedrooms(2);
		});
		assertInvalid(query -> {
			query.setMinBathrooms(new BigDecimal("2.0"));
			query.setMaxBathrooms(new BigDecimal("1.0"));
		});
		assertInvalid(query -> {
			query.setMinYearBuilt(2000);
			query.setMaxYearBuilt(1999);
		});
		assertInvalid(query -> {
			query.setMinLotSize(BigDecimal.TEN);
			query.setMaxLotSize(BigDecimal.ONE);
		});
		assertInvalid(query -> {
			query.setMinDistanceToCityCenter(BigDecimal.TEN);
			query.setMaxDistanceToCityCenter(BigDecimal.ONE);
		});
		assertInvalid(query -> {
			query.setMinSchoolRating(BigDecimal.TEN);
			query.setMaxSchoolRating(BigDecimal.ONE);
		});
		assertInvalid(query -> {
			query.setMinPrice(BigDecimal.TEN);
			query.setMaxPrice(BigDecimal.ONE);
		});
	}

	@Test
	void shouldRejectInvalidNegativeAndControlParameters() {
		assertInvalid(query -> query.setMinSquareFootage(BigDecimal.ZERO));
		assertInvalid(query -> query.setMinBedrooms(-1));
		assertInvalid(query -> query.setMinBathrooms(new BigDecimal("-0.1")));
		assertInvalid(query -> query.setMinYearBuilt(1799));
		assertInvalid(query -> query.setMinLotSize(BigDecimal.ZERO));
		assertInvalid(query -> query.setMinDistanceToCityCenter(new BigDecimal("-0.1")));
		assertInvalid(query -> query.setMinSchoolRating(new BigDecimal("-0.1")));
		assertInvalid(query -> query.setMaxSchoolRating(new BigDecimal("10.1")));
		assertInvalid(query -> query.setMinPrice(new BigDecimal("-0.1")));
		assertInvalid(query -> query.setPriceBucketCount(0));
		assertInvalid(query -> query.setScatterLimit(5001));
	}

	@Test
	void shouldReturnEmptyDashboardWhenNoRecords() {
		DashboardServiceImpl dashboardService = dashboardService(mapperStub(invocation -> {
			if ("selectMetrics".equals(invocation.methodName())) {
				return DashboardMetricsVO.empty();
			}
			return null;
		}));

		DashboardVO result = dashboardService.dashboard(null);

		assertNotNull(result.getMetrics());
		assertEquals(0L, result.getMetrics().getTotalRecords());
		assertEquals(Collections.emptyList(), result.getPriceDistribution());
		assertEquals(Collections.emptyList(), result.getPriceSquareScatter());
		assertEquals(Collections.emptyList(), result.getPriceYearTrend());
	}

	@Test
	void shouldFillPriceDistributionLabel() {
		DashboardMetricsVO metrics = new DashboardMetricsVO()
				.setTotalRecords(1L)
				.setAvgPrice(new BigDecimal("200.00"))
				.setAvgPricePerSqFt(new BigDecimal("100.00"));
		PriceDistributionPointVO point = new PriceDistributionPointVO();
		point.setBucketStart(new BigDecimal("100.00"));
		point.setBucketEnd(new BigDecimal("200.50"));
		point.setCount(1L);
		List<PriceDistributionPointVO> points = new ArrayList<>();
		points.add(point);
		DashboardServiceImpl dashboardService = dashboardService(mapperStub(invocation -> switch (invocation.methodName()) {
			case "selectMetrics" -> metrics;
			case "selectMedianPrice" -> new BigDecimal("200.00");
			case "selectPriceDistribution" -> points;
			case "selectPriceSquareScatter", "selectPriceYearTrend" -> Collections.emptyList();
			default -> null;
		}));

		DashboardVO result = dashboardService.dashboard(new DashboardQueryRequest());

		assertEquals("100-200.5", result.getPriceDistribution().get(0).getLabel());
	}

	@Test
	void shouldSetDeltaVsBaselineToZeroWhenNoDataFilter() {
		DashboardMetricsVO metrics = new DashboardMetricsVO()
				.setTotalRecords(2L)
				.setAvgPrice(new BigDecimal("200.00"))
				.setAvgPricePerSqFt(new BigDecimal("100.00"));
		DashboardServiceImpl dashboardService = dashboardService(mapperStub(invocation -> switch (invocation.methodName()) {
			case "selectMetrics" -> metrics;
			case "selectMedianPrice" -> new BigDecimal("180.00");
			case "selectPriceDistribution", "selectPriceSquareScatter", "selectPriceYearTrend" -> Collections.emptyList();
			default -> null;
		}));

		DashboardVO result = dashboardService.dashboard(new DashboardQueryRequest());

		assertEquals(BigDecimal.ZERO, result.getMetrics().getDeltaVsBaseline().getAvgPredictedPrice());
		assertEquals(BigDecimal.ZERO, result.getMetrics().getDeltaVsBaseline().getMedianPredictedPrice());
		assertEquals(BigDecimal.ZERO, result.getMetrics().getDeltaVsBaseline().getAvgPricePerSquareFoot());
	}

	@Test
	void shouldSetDeltaVsBaselineToZeroWhenOnlyNoOpMinFilters() {
		DashboardMetricsVO metrics = new DashboardMetricsVO()
				.setTotalRecords(2L)
				.setAvgPrice(new BigDecimal("200.00"))
				.setAvgPricePerSqFt(new BigDecimal("100.00"));
		DashboardServiceImpl dashboardService = dashboardService(mapperStub(invocation -> switch (invocation.methodName()) {
			case "selectMetrics" -> metrics;
			case "selectMedianPrice" -> new BigDecimal("180.00");
			case "selectPriceDistribution", "selectPriceSquareScatter", "selectPriceYearTrend" -> Collections.emptyList();
			default -> null;
		}));

		DashboardQueryRequest request = new DashboardQueryRequest();
		request.setMinPrice(BigDecimal.ZERO);
		request.setMinBedrooms(0);
		DashboardVO result = dashboardService.dashboard(request);

		assertEquals(BigDecimal.ZERO, result.getMetrics().getDeltaVsBaseline().getAvgPredictedPrice());
	}

	@Test
	void shouldCalculateDeltaVsBaselineWhenFiltered() {
		DashboardQueryRequest request = new DashboardQueryRequest();
		request.setMinPrice(new BigDecimal("100000"));
		DashboardMetricsVO filteredMetrics = new DashboardMetricsVO()
				.setTotalRecords(1L)
				.setAvgPrice(new BigDecimal("250000.00"))
				.setAvgPricePerSqFt(new BigDecimal("200.00"));
		DashboardMetricsVO baselineMetrics = new DashboardMetricsVO()
				.setTotalRecords(2L)
				.setAvgPrice(new BigDecimal("200000.00"))
				.setAvgPricePerSqFt(new BigDecimal("100.00"));
		DashboardServiceImpl dashboardService = dashboardService(mapperStub(invocation -> {
			DashboardQueryRequest query = (DashboardQueryRequest) invocation.args()[0];
			return switch (invocation.methodName()) {
				case "selectMetrics" -> hasDataFilter(query) ? filteredMetrics : baselineMetrics;
				case "selectMedianPrice" -> hasDataFilter(query) ? new BigDecimal("240000.00") : new BigDecimal("200000.00");
				case "selectPriceDistribution", "selectPriceSquareScatter", "selectPriceYearTrend" -> Collections.emptyList();
				default -> null;
			};
		}));

		DashboardVO result = dashboardService.dashboard(request);

		assertEquals(new BigDecimal("25.00"), result.getMetrics().getDeltaVsBaseline().getAvgPredictedPrice());
		assertEquals(new BigDecimal("20.00"), result.getMetrics().getDeltaVsBaseline().getMedianPredictedPrice());
		assertEquals(new BigDecimal("100.00"), result.getMetrics().getDeltaVsBaseline().getAvgPricePerSquareFoot());
	}

	private boolean hasDataFilter(DashboardQueryRequest query) {
		return query.getMinPrice() != null;
	}

	private void assertInvalid(Consumer<DashboardQueryRequest> consumer) {
		DashboardQueryRequest request = new DashboardQueryRequest();
		consumer.accept(request);
		DashboardServiceImpl dashboardService = dashboardService(mapperStub(invocation -> null));
		assertThrows(BusinessException.class, () -> dashboardService.dashboard(request));
	}

	private DashboardServiceImpl dashboardService(HouseRecordMapper mapper) {
		return new DashboardServiceImpl(mapper, new DashboardQueryValidator());
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
