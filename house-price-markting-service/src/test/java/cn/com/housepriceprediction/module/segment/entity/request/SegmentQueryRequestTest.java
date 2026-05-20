package cn.com.housepriceprediction.module.segment.entity.request;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class SegmentQueryRequestTest {

	@Test
	void shouldMergeNestedFiltersIntoResolvedRequest() {
		SegmentQueryRequest filters = new SegmentQueryRequest();
		filters.setSegmentDimension("bathrooms");
		filters.setMinPrice(new BigDecimal("150000"));

		SegmentQueryRequest body = new SegmentQueryRequest();
		body.setFilters(filters);
		body.setSegmentDimension("bedrooms");

		SegmentQueryRequest resolved = body.resolve(null);

		assertEquals("bedrooms", resolved.getSegmentDimension());
		assertEquals(new BigDecimal("150000"), resolved.getMinPrice());
		assertNull(resolved.getFilters());
	}

	@Test
	void shouldPreferBodyFieldsOverNestedFiltersAndQueryParams() {
		SegmentQueryRequest filters = new SegmentQueryRequest();
		filters.setSegmentDimension("year_built_decade");
		filters.setMinPrice(new BigDecimal("100000"));

		SegmentQueryRequest queryParams = new SegmentQueryRequest();
		queryParams.setSegmentDimension("distance_band");
		queryParams.setMinPrice(new BigDecimal("120000"));

		SegmentQueryRequest body = new SegmentQueryRequest();
		body.setFilters(filters);
		body.setSegmentDimension("bedrooms");
		body.setMinPrice(new BigDecimal("200000"));

		SegmentQueryRequest resolved = body.resolve(queryParams);

		assertEquals("bedrooms", resolved.getSegmentDimension());
		assertEquals(new BigDecimal("200000"), resolved.getMinPrice());
	}
}
