package cn.com.housepriceprediction.module.segment.entity.request;

import cn.com.housepriceprediction.module.dashboard.entity.request.DashboardQueryRequest;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serial;

/**
 * Segments 查询请求
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class SegmentQueryRequest extends DashboardQueryRequest {

	@Schema(description = "分组维度", requiredMode = Schema.RequiredMode.REQUIRED)
	private String segmentDimension;

	@Schema(hidden = true)
	@JsonProperty("filters")
	private SegmentQueryRequest filters;

	/**
	 * 合并 JSON body、query/form 参数与嵌套 filters，优先级：body &gt; query/form &gt; filters。
	 */
	public SegmentQueryRequest resolve(SegmentQueryRequest queryParams) {
		SegmentQueryRequest resolved = new SegmentQueryRequest();
		mergeSegmentFields(resolved, this.filters);
		mergeSegmentFields(resolved, queryParams);
		mergeSegmentFields(resolved, this);
		return resolved;
	}

	private static void mergeSegmentFields(SegmentQueryRequest target, SegmentQueryRequest source) {
		if (source == null) {
			return;
		}
		mergeFields(target, source);
		if (source.getSegmentDimension() != null) {
			target.setSegmentDimension(source.getSegmentDimension());
		}
	}

	@Serial
	private static final long serialVersionUID = 1L;
}
