package cn.com.housepriceprediction.module.whatif.entity.request;

import cn.com.housepriceprediction.module.dashboard.entity.request.DashboardQueryRequest;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serial;

/**
 * What-if Baseline 查询请求（与 Dashboard 筛选字段一致，不含 priceBucketCount、scatterLimit）
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class WhatIfBaselineQueryRequest extends DashboardQueryRequest {

	@Schema(hidden = true)
	@JsonProperty("filters")
	private WhatIfBaselineQueryRequest filters;

	/**
	 * 合并 JSON body、query/form 参数与嵌套 filters，优先级：body &gt; query/form &gt; filters。
	 */
	public WhatIfBaselineQueryRequest resolve(WhatIfBaselineQueryRequest queryParams) {
		WhatIfBaselineQueryRequest resolved = new WhatIfBaselineQueryRequest();
		mergeWhatIfFields(resolved, this.filters);
		mergeWhatIfFields(resolved, queryParams);
		mergeWhatIfFields(resolved, this);
		return resolved;
	}

	private static void mergeWhatIfFields(WhatIfBaselineQueryRequest target, WhatIfBaselineQueryRequest source) {
		if (source == null) {
			return;
		}
		mergeFields(target, source);
	}

	@Serial
	private static final long serialVersionUID = 1L;
}
