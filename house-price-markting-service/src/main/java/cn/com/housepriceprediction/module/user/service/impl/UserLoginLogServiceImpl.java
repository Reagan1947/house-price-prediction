package cn.com.housepriceprediction.module.user.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import cn.com.housepriceprediction.module.user.entity.DO.UserLoginLog;
import cn.com.housepriceprediction.module.user.mapper.UserLoginLogMapper;
import cn.com.housepriceprediction.module.user.service.UserLoginLogService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Date;

/**
 * 用户登录日志表 (user_login_log) - 业务服务实现
 *
 * @author 2025-04-25 21:02:12
 */
@Slf4j
@Service
public class UserLoginLogServiceImpl extends ServiceImpl<UserLoginLogMapper, UserLoginLog> implements UserLoginLogService {

	/**
	 * 记录登录日志
	 *
	 * @param userId    用户ID
	 * @param loginTime 登录时间
	 * @param loginIp   登录IP
	 * @param userAgent 登录设备信息
	 */
	@Async(value = "logThreadPool")
	@Override
	public void recordLoginLog(Long userId, Date loginTime, String loginIp, String userAgent) {
		UserLoginLog userLoginLog = new UserLoginLog();
		userLoginLog.setUserId(userId);
		userLoginLog.setLoginIp(loginIp);
		userLoginLog.setLoginTime(loginTime);
		userLoginLog.setUserAgent(userAgent);
		this.save(userLoginLog);
		log.info("[登录日志] 用户 [{}] 登录成功!", userId);
	}
}
