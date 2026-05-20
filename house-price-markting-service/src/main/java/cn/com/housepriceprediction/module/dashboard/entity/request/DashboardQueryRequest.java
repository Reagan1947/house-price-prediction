package cn.com.housepriceprediction.module.dashboard.entity.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;

/**
 * Dashboard 查询请求
 */
@Data
public class DashboardQueryRequest implements Serializable {

	@Schema(description = "ID 最小值")
	private Long minId;

	@Schema(description = "ID 最大值")
	private Long maxId;

	@Schema(description = "面积最小值")
	private BigDecimal minSquareFootage;

	@Schema(description = "面积最大值")
	private BigDecimal maxSquareFootage;

	@Schema(description = "卧室数量最小值")
	private Integer minBedrooms;

	@Schema(description = "卧室数量最大值")
	private Integer maxBedrooms;

	@Schema(description = "浴室数量最小值")
	private BigDecimal minBathrooms;

	@Schema(description = "浴室数量最大值")
	private BigDecimal maxBathrooms;

	@Schema(description = "建造年份最小值")
	private Integer minYearBuilt;

	@Schema(description = "建造年份最大值")
	private Integer maxYearBuilt;

	@Schema(description = "土地面积最小值")
	private BigDecimal minLotSize;

	@Schema(description = "土地面积最大值")
	private BigDecimal maxLotSize;

	@Schema(description = "距离市中心最小值")
	private BigDecimal minDistanceToCityCenter;

	@Schema(description = "距离市中心最大值")
	private BigDecimal maxDistanceToCityCenter;

	@Schema(description = "学校评分最小值")
	private BigDecimal minSchoolRating;

	@Schema(description = "学校评分最大值")
	private BigDecimal maxSchoolRating;

	@Schema(description = "价格最小值")
	private BigDecimal minPrice;

	@Schema(description = "价格最大值")
	private BigDecimal maxPrice;

	@Schema(description = "价格分布区间数量")
	private Integer priceBucketCount;

	@Schema(description = "散点图最大返回点数")
	private Integer scatterLimit;

	@Schema(hidden = true)
	@JsonProperty("filters")
	private DashboardQueryRequest filters;

	/**
	 * 合并 JSON body、query/form 参数与嵌套 filters，优先级：body &gt; query/form &gt; filters。
	 */
	public DashboardQueryRequest resolve(DashboardQueryRequest queryParams) {
		DashboardQueryRequest resolved = new DashboardQueryRequest();
		mergeFields(resolved, this.filters);
		mergeFields(resolved, queryParams);
		mergeFields(resolved, this);
		return resolved;
	}

	protected static void mergeFields(DashboardQueryRequest target, DashboardQueryRequest source) {
		if (source == null) {
			return;
		}
		if (source.getMinId() != null) {
			target.setMinId(source.getMinId());
		}
		if (source.getMaxId() != null) {
			target.setMaxId(source.getMaxId());
		}
		if (source.getMinSquareFootage() != null) {
			target.setMinSquareFootage(source.getMinSquareFootage());
		}
		if (source.getMaxSquareFootage() != null) {
			target.setMaxSquareFootage(source.getMaxSquareFootage());
		}
		if (source.getMinBedrooms() != null) {
			target.setMinBedrooms(source.getMinBedrooms());
		}
		if (source.getMaxBedrooms() != null) {
			target.setMaxBedrooms(source.getMaxBedrooms());
		}
		if (source.getMinBathrooms() != null) {
			target.setMinBathrooms(source.getMinBathrooms());
		}
		if (source.getMaxBathrooms() != null) {
			target.setMaxBathrooms(source.getMaxBathrooms());
		}
		if (source.getMinYearBuilt() != null) {
			target.setMinYearBuilt(source.getMinYearBuilt());
		}
		if (source.getMaxYearBuilt() != null) {
			target.setMaxYearBuilt(source.getMaxYearBuilt());
		}
		if (source.getMinLotSize() != null) {
			target.setMinLotSize(source.getMinLotSize());
		}
		if (source.getMaxLotSize() != null) {
			target.setMaxLotSize(source.getMaxLotSize());
		}
		if (source.getMinDistanceToCityCenter() != null) {
			target.setMinDistanceToCityCenter(source.getMinDistanceToCityCenter());
		}
		if (source.getMaxDistanceToCityCenter() != null) {
			target.setMaxDistanceToCityCenter(source.getMaxDistanceToCityCenter());
		}
		if (source.getMinSchoolRating() != null) {
			target.setMinSchoolRating(source.getMinSchoolRating());
		}
		if (source.getMaxSchoolRating() != null) {
			target.setMaxSchoolRating(source.getMaxSchoolRating());
		}
		if (source.getMinPrice() != null) {
			target.setMinPrice(source.getMinPrice());
		}
		if (source.getMaxPrice() != null) {
			target.setMaxPrice(source.getMaxPrice());
		}
		if (source.getPriceBucketCount() != null) {
			target.setPriceBucketCount(source.getPriceBucketCount());
		}
		if (source.getScatterLimit() != null) {
			target.setScatterLimit(source.getScatterLimit());
		}
	}

	@Serial
	private static final long serialVersionUID = 1L;
}
