package cn.com.housepriceprediction.module.whatif.entity.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 房屋特征（7 维）
 */
@Data
@Accessors(chain = true)
public class HouseFeaturesVO implements Serializable {

	@Schema(description = "面积")
	private BigDecimal squareFootage;

	@Schema(description = "卧室数量")
	private Integer bedrooms;

	@Schema(description = "浴室数量")
	private BigDecimal bathrooms;

	@Schema(description = "建造年份")
	private Integer yearBuilt;

	@Schema(description = "土地面积")
	private BigDecimal lotSize;

	@Schema(description = "距市中心距离")
	private BigDecimal distanceToCityCenter;

	@Schema(description = "学校评分")
	private BigDecimal schoolRating;

	@Serial
	private static final long serialVersionUID = 1L;
}
