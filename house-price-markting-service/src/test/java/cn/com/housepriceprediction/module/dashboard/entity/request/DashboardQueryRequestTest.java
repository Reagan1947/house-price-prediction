package cn.com.housepriceprediction.module.dashboard.entity.request;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class DashboardQueryRequestTest {

	@Test
	void shouldMergeNestedFiltersIntoResolvedRequest() {
		DashboardQueryRequest filters = new DashboardQueryRequest();
		filters.setMinPrice(new BigDecimal("150000"));

		DashboardQueryRequest body = new DashboardQueryRequest();
		body.setFilters(filters);
		body.setPriceBucketCount(12);

		DashboardQueryRequest resolved = body.resolve(null);

		assertEquals(new BigDecimal("150000"), resolved.getMinPrice());
		assertEquals(12, resolved.getPriceBucketCount());
		assertNull(resolved.getFilters());
	}

	@Test
	void shouldPreferBodyFieldsOverNestedFiltersAndQueryParams() {
		DashboardQueryRequest filters = new DashboardQueryRequest();
		filters.setMinPrice(new BigDecimal("100000"));

		DashboardQueryRequest queryParams = new DashboardQueryRequest();
		queryParams.setMinPrice(new BigDecimal("120000"));
		queryParams.setScatterLimit(500);

		DashboardQueryRequest body = new DashboardQueryRequest();
		body.setFilters(filters);
		body.setMinPrice(new BigDecimal("200000"));

		DashboardQueryRequest resolved = body.resolve(queryParams);

		assertEquals(new BigDecimal("200000"), resolved.getMinPrice());
		assertEquals(500, resolved.getScatterLimit());
	}
}
