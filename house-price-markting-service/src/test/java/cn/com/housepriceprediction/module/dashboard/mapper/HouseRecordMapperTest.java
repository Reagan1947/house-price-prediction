package cn.com.housepriceprediction.module.dashboard.mapper;

import cn.com.housepriceprediction.module.dashboard.entity.request.DashboardQueryRequest;
import cn.com.housepriceprediction.module.dashboard.entity.vo.DashboardMetricsVO;
import cn.com.housepriceprediction.module.dashboard.entity.vo.PriceYearTrendPointVO;
import cn.com.housepriceprediction.module.segment.entity.enums.SegmentDimension;
import cn.com.housepriceprediction.module.segment.entity.request.SegmentQueryRequest;
import cn.com.housepriceprediction.module.segment.entity.vo.SegmentChartPointVO;
import cn.com.housepriceprediction.module.segment.entity.vo.SegmentGroupRowVO;
import cn.com.housepriceprediction.module.whatif.entity.request.WhatIfBaselineQueryRequest;
import cn.com.housepriceprediction.module.whatif.entity.vo.HouseFeaturesVO;
import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.datasource.pooled.PooledDataSource;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.mapping.Environment;
import org.apache.ibatis.session.Configuration;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import org.apache.ibatis.transaction.jdbc.JdbcTransactionFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HouseRecordMapperTest {

	private static SqlSessionFactory sqlSessionFactory;

	private SqlSession sqlSession;
	private HouseRecordMapper houseRecordMapper;

	@BeforeAll
	static void beforeAll() throws Exception {
		String url = testProperty("dashboard.test.db.url", "DASHBOARD_TEST_DB_URL", null);
		Assumptions.assumeTrue(url != null && !url.isBlank(),
				"Set dashboard.test.db.url or DASHBOARD_TEST_DB_URL to run MySQL 8 mapper integration tests");
		String username = testProperty("dashboard.test.db.username", "DASHBOARD_TEST_DB_USERNAME", "root");
		String password = testProperty("dashboard.test.db.password", "DASHBOARD_TEST_DB_PASSWORD", "");

		PooledDataSource dataSource = new PooledDataSource("com.mysql.cj.jdbc.Driver", url, username, password);
		Environment environment = new Environment("dashboard-mysql8-test", new JdbcTransactionFactory(), dataSource);
		Configuration configuration = new Configuration(environment);
		configuration.setMapUnderscoreToCamelCase(true);
		try (InputStream mapperXml = Resources.getResourceAsStream("mapper/HouseRecordMapper.xml")) {
			XMLMapperBuilder mapperParser = new XMLMapperBuilder(
					mapperXml, configuration, "mapper/HouseRecordMapper.xml", configuration.getSqlFragments());
			mapperParser.parse();
		}
		sqlSessionFactory = new SqlSessionFactoryBuilder().build(configuration);
	}

	@BeforeEach
	void setUp() {
		sqlSession = sqlSessionFactory.openSession();
		houseRecordMapper = sqlSession.getMapper(HouseRecordMapper.class);
	}

	@AfterEach
	void tearDown() {
		if (sqlSession != null) {
			sqlSession.close();
		}
	}

	@Test
	void shouldSelectMetricsWithoutFilter() {
		DashboardMetricsVO metrics = houseRecordMapper.selectMetrics(new DashboardQueryRequest());

		assertNotNull(metrics);
		assertEquals(50L, metrics.getTotalRecords());
		assertNotNull(metrics.getAvgPrice());
		assertNotNull(metrics.getAvgPricePerSqFt());
	}

	@Test
	void shouldSelectMedianPrice() {
		BigDecimal medianPrice = houseRecordMapper.selectMedianPrice(new DashboardQueryRequest());

		assertNotNull(medianPrice);
		assertTrue(medianPrice.compareTo(BigDecimal.ZERO) > 0);
	}

	@Test
	void shouldApplyPriceFilterToMetrics() {
		DashboardQueryRequest request = new DashboardQueryRequest();
		request.setMinPrice(new BigDecimal("200000"));

		DashboardMetricsVO metrics = houseRecordMapper.selectMetrics(request);

		assertTrue(metrics.getTotalRecords() > 0);
		assertTrue(metrics.getTotalRecords() < 50);
	}

	@Test
	void shouldSelectSegmentTableGroupsByBedrooms() {
		SegmentQueryRequest request = new SegmentQueryRequest();
		List<SegmentGroupRowVO> rows = houseRecordMapper.selectSegmentTableGroups(request, SegmentDimension.BEDROOMS);

		assertTrue(rows.size() >= 2);
		for (int i = 1; i < rows.size(); i++) {
			assertTrue(new BigDecimal(rows.get(i - 1).getGroupKey())
					.compareTo(new BigDecimal(rows.get(i).getGroupKey())) <= 0);
		}
	}

	@Test
	void shouldApplyPriceFilterToSegmentGroups() {
		SegmentQueryRequest request = new SegmentQueryRequest();
		request.setMinPrice(new BigDecimal("200000"));

		List<SegmentGroupRowVO> rows = houseRecordMapper.selectSegmentTableGroups(request, SegmentDimension.BEDROOMS);

		assertTrue(rows.size() > 0);
		assertTrue(rows.size() < houseRecordMapper.selectSegmentTableGroups(new SegmentQueryRequest(), SegmentDimension.BEDROOMS).size());
	}

	@Test
	void shouldKeepChartMedianPriceConsistentWithTable() {
		SegmentQueryRequest request = new SegmentQueryRequest();
		List<SegmentGroupRowVO> rows = houseRecordMapper.selectSegmentTableGroups(request, SegmentDimension.BEDROOMS);
		List<SegmentChartPointVO> points = houseRecordMapper.selectSegmentChartGroups(request, SegmentDimension.BEDROOMS);

		assertEquals(rows.size(), points.size());
		for (int i = 0; i < rows.size(); i++) {
			assertEquals(rows.get(i).getGroupKey(), points.get(i).getGroupKey());
			assertEquals(rows.get(i).getCount(), points.get(i).getCount());
			assertEquals(0, rows.get(i).getMedian().compareTo(points.get(i).getMedianPrice()));
		}
	}

	@Test
	void shouldCountByFilterWithoutFilter() {
		Long count = houseRecordMapper.countByFilter(new WhatIfBaselineQueryRequest());

		assertEquals(50L, count);
	}

	@Test
	void shouldSelectBaselineFeaturesWithoutFilter() {
		HouseFeaturesVO features = houseRecordMapper.selectBaselineFeatures(new WhatIfBaselineQueryRequest());

		assertNotNull(features);
		assertNotNull(features.getSquareFootage());
		assertNotNull(features.getBedrooms());
		assertNotNull(features.getBathrooms());
		assertNotNull(features.getYearBuilt());
		assertNotNull(features.getLotSize());
		assertNotNull(features.getDistanceToCityCenter());
		assertNotNull(features.getSchoolRating());
	}

	@Test
	void shouldApplyPriceFilterToBaselineCount() {
		WhatIfBaselineQueryRequest request = new WhatIfBaselineQueryRequest();
		request.setMinPrice(new BigDecimal("200000"));

		Long count = houseRecordMapper.countByFilter(request);

		assertTrue(count > 0);
		assertTrue(count < 50);
	}

	@Test
	void shouldReturnZeroCountWhenPriceFilterMatchesNothing() {
		WhatIfBaselineQueryRequest request = new WhatIfBaselineQueryRequest();
		request.setMinPrice(new BigDecimal("500000"));

		Long count = houseRecordMapper.countByFilter(request);

		assertEquals(0L, count);
	}

	@Test
	void shouldReturnYearTrendOrderedByYearBuilt() {
		List<PriceYearTrendPointVO> trend = houseRecordMapper.selectPriceYearTrend(new DashboardQueryRequest());

		assertTrue(trend.size() > 1);
		for (int i = 1; i < trend.size(); i++) {
			assertTrue(trend.get(i - 1).getYearBuilt() < trend.get(i).getYearBuilt());
		}
	}

	private static String testProperty(String propertyName, String envName, String defaultValue) {
		String systemValue = System.getProperty(propertyName);
		if (systemValue != null && !systemValue.isBlank()) {
			return systemValue;
		}
		String envValue = System.getenv(envName);
		if (envValue != null && !envValue.isBlank()) {
			return envValue;
		}
		return defaultValue;
	}
}
