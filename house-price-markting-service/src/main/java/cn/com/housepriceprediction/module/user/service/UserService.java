package cn.com.housepriceprediction.module.user.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.IService;
import cn.com.housepriceprediction.common.page.PageResponse;
import cn.com.housepriceprediction.module.user.entity.DO.User;
import cn.com.housepriceprediction.module.user.entity.request.UserBanRequest;
import cn.com.housepriceprediction.module.user.entity.request.UserLoginRequest;
import cn.com.housepriceprediction.module.user.entity.request.UserQueryRequest;
import cn.com.housepriceprediction.module.user.entity.request.UserRegisterRequest;
import cn.com.housepriceprediction.module.user.entity.request.UserUpdatePasswordRequest;
import cn.com.housepriceprediction.module.user.entity.request.UserUpdateRequest;
import cn.com.housepriceprediction.module.user.entity.vo.UserInfoVO;
import cn.com.housepriceprediction.module.user.entity.vo.UserVO;

/**
 * 用户表 (user) - 业务服务接口
 *
 * @author Baolong 2025-04-25 21:02:12
 */
public interface UserService extends IService<User> {

	/**
	 * 用户注册
	 *
	 * @param userRegisterRequest 用户注册请求
	 * @return 成功
	 */
	Boolean register(UserRegisterRequest userRegisterRequest);

	/**
	 * 填充用户默认字段
	 *
	 * @param user 用户对象
	 */
	void fillUserDefaultField(User user);

	/**
	 * 加密密码
	 *
	 * @param password 原始密码
	 * @return 加密后的密码
	 */
	String encryptPassword(String password);

	/**
	 * 用户登录
	 *
	 * @param userLoginRequest 用户登录请求
	 * @return Token
	 */
	String login(UserLoginRequest userLoginRequest);

	/**
	 * 用户注销
	 */
	void logout();

	/**
	 * 获取登录用户信息
	 *
	 * @return 用户信息
	 */
	UserInfoVO getLoginUserInfo();

	/**
	 * 更新用户信息
	 *
	 * @param userUpdateRequest 用户更新请求
	 * @return 成功
	 */
	Boolean updateInfo(UserUpdateRequest userUpdateRequest);

	/**
	 * 修改用户密码
	 *
	 * @param userUpdatePasswordRequest 用户修改密码请求
	 * @return 成功
	 */
	Boolean updatePassword(UserUpdatePasswordRequest userUpdatePasswordRequest);

	/**
	 * 封禁用户
	 *
	 * @param userBanRequest 用户禁用请求
	 * @return 成功
	 */
	String banUserAsAdmin(UserBanRequest userBanRequest);

	/**
	 * 获取查询条件构造器
	 *
	 * @param queryRequest 查询请求对象
	 * @return 查询条件构造器
	 */
	LambdaQueryWrapper<User> lambdaQueryWrapper(UserQueryRequest queryRequest);

	/**
	 * 获取用户分页
	 *
	 * @param userQueryRequest 用户查询请求
	 * @return 用户分页
	 */
	PageResponse<UserVO> getUserPage(UserQueryRequest userQueryRequest);
}
