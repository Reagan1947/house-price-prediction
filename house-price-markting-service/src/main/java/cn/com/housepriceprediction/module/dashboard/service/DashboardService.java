package cn.com.housepriceprediction.module.dashboard.service;

import cn.com.housepriceprediction.module.dashboard.entity.request.DashboardQueryRequest;
import cn.com.housepriceprediction.module.dashboard.entity.vo.DashboardVO;

/**
 * Dashboard Service
 */
public interface DashboardService {

	DashboardVO dashboard(DashboardQueryRequest request);
}
