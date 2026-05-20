package cn.com.housepriceprediction.module.dashboard.entity.DO;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

/**
 * 房屋记录表
 */
@TableName(value = "house_record")
@Data
@Accessors(chain = true)
public class HouseRecord implements Serializable {

	@TableId(value = "id", type = IdType.AUTO)
	private Long id;

	@TableField(value = "square_footage")
	private BigDecimal squareFootage;

	@TableField(value = "bedrooms")
	private Integer bedrooms;

	@TableField(value = "bathrooms")
	private BigDecimal bathrooms;

	@TableField(value = "year_built")
	private Integer yearBuilt;

	@TableField(value = "lot_size")
	private BigDecimal lotSize;

	@TableField(value = "distance_to_city_center")
	private BigDecimal distanceToCityCenter;

	@TableField(value = "school_rating")
	private BigDecimal schoolRating;

	@TableField(value = "price")
	private BigDecimal price;

	@TableField(value = "create_time")
	private Date createTime;

	@TableField(value = "update_time")
	private Date updateTime;

	@TableField(exist = false)
	@Serial
	private static final long serialVersionUID = 1L;
}
