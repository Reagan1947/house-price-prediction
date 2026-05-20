package cn.com.housepriceprediction.module.whatif.entity.request;

import cn.com.housepriceprediction.module.whatif.entity.vo.HouseFeaturesVO;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

/**
 * 场景预测请求
 */
@Data
public class ScenarioPredictRequest implements Serializable {

	@Schema(description = "单笔场景特征，与 featuresList 二选一")
	private HouseFeaturesVO features;

	@Schema(description = "批次场景特征列表，与 features 二选一")
	private List<HouseFeaturesVO> featuresList;

	@Serial
	private static final long serialVersionUID = 1L;
}
