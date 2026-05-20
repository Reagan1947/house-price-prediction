package cn.com.housepriceprediction.module.whatif.entity.request;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class WhatIfBaselineQueryRequestTest {

	@Test
	void shouldMergeBodyOverQueryOverFilters() {
		WhatIfBaselineQueryRequest filters = new WhatIfBaselineQueryRequest();
		filters.setMinBedrooms(1);

		WhatIfBaselineQueryRequest queryParams = new WhatIfBaselineQueryRequest();
		queryParams.setMinBedrooms(2);
		queryParams.setMaxBedrooms(4);

		WhatIfBaselineQueryRequest body = new WhatIfBaselineQueryRequest();
		body.setFilters(filters);
		body.setMinBedrooms(3);
		body.setMinPrice(new BigDecimal("100000"));

		WhatIfBaselineQueryRequest resolved = body.resolve(queryParams);

		assertEquals(3, resolved.getMinBedrooms());
		assertEquals(4, resolved.getMaxBedrooms());
		assertEquals(new BigDecimal("100000"), resolved.getMinPrice());
	}

	@Test
	void shouldNotCopyDashboardOnlyFieldsFromFilters() {
		WhatIfBaselineQueryRequest filters = new WhatIfBaselineQueryRequest();
		filters.setPriceBucketCount(10);
		filters.setScatterLimit(100);

		WhatIfBaselineQueryRequest body = new WhatIfBaselineQueryRequest();
		body.setFilters(filters);

		WhatIfBaselineQueryRequest resolved = body.resolve(null);

		assertEquals(10, resolved.getPriceBucketCount());
		assertEquals(100, resolved.getScatterLimit());
		assertNull(resolved.getMinBedrooms());
	}
}
