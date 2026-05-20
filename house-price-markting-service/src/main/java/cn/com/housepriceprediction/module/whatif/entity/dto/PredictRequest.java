package cn.com.housepriceprediction.module.whatif.entity.dto;

import cn.com.housepriceprediction.module.whatif.entity.vo.HouseFeaturesVO;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;

/**
 * prediction-service 单笔预测请求（snake_case）
 */
@Data
@Accessors(chain = true)
public class PredictRequest implements Serializable {

	@JsonProperty("square_footage")
	private BigDecimal squareFootage;

	private Integer bedrooms;

	private BigDecimal bathrooms;

	@JsonProperty("year_built")
	private Integer yearBuilt;

	@JsonProperty("lot_size")
	private BigDecimal lotSize;

	@JsonProperty("distance_to_city_center")
	private BigDecimal distanceToCityCenter;

	@JsonProperty("school_rating")
	private BigDecimal schoolRating;

	public static PredictRequest from(HouseFeaturesVO features) {
		return new PredictRequest()
				.setSquareFootage(features.getSquareFootage())
				.setBedrooms(features.getBedrooms())
				.setBathrooms(features.getBathrooms())
				.setYearBuilt(features.getYearBuilt())
				.setLotSize(features.getLotSize())
				.setDistanceToCityCenter(features.getDistanceToCityCenter())
				.setSchoolRating(features.getSchoolRating());
	}

	@Serial
	private static final long serialVersionUID = 1L;
}
