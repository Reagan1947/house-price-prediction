package cn.com.housepriceprediction.config;

import cn.dev33.satoken.interceptor.SaInterceptor;
import cn.dev33.satoken.jwt.StpLogicJwtForSimple;
import cn.dev33.satoken.router.SaRouter;
import cn.dev33.satoken.stp.StpLogic;
import cn.dev33.satoken.stp.StpUtil;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Sa-Token 配置
 *
 * @author Silas Yan 2025-04-25 20:27
 */
@Configuration
public class SaTokenConfig implements WebMvcConfigurer {

	/**
	 * 注册拦截器
	 *
	 * @param registry InterceptorRegistry
	 */
	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(new SaInterceptor(handler -> {
							SaRouter.match("/**")
									.notMatch("/test/1", "/test/2", "/dashboard", "/segments/**", "/what-if/**")
									.check(r -> StpUtil.checkLogin());
						})
				)
				.addPathPatterns("/**")
				.excludePathPatterns("/error", "/favicon.ico", "/doc.html", "/v3/api-docs/**", "/webjars/**"
						, "/health"
				);
	}

	/**
	 * Sa-Token 整合 jwt (Simple 简单模式)
	 *
	 * @return StpLogic
	 */
	@Bean
	public StpLogic getStpLogicJwt() {
		return new StpLogicJwtForSimple();
	}
}
