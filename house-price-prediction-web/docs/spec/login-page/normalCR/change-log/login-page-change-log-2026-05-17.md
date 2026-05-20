# Login 页面变更记录（2026-05-17）

## 1. 变更概述

本次完成了 Login 页面从设计输出到页面落地的完整实现，并打通与 Landing 页的跳转链路，包含：

- Login 详细设计文档输出
- Login 开发任务拆分文档输出
- Login 页面组件化开发与样式实现
- 登录表单交互（邮箱校验、密码必填、密码显隐）
- 已登录访问 `/login` 自动跳转 Portal
- 全局字体调整：移除 Google Fonts，统一与 Landing Page 使用同一字体栈

## 2. 文档变更

### 2.1 新增详细设计文档

- `docs/spec/login-page/normalCR/detail-design/login-page-detail-design.md`

内容包含：范围定义、Figma 节点映射、视觉/交互规范、校验规则、路由守卫、响应式与可访问性策略、测试与验收标准。

### 2.2 新增开发任务拆分文档

- `docs/spec/login-page/normalCR/task/login-page-development-task.md`

内容包含：WBS（T0-T8）、里程碑、依赖关系、DoD、风险与开发检查清单。

## 3. 代码与资源变更

### 3.1 页面与路由

- 修改：`app/login/page.tsx`
  - Login 占位页替换为正式页面入口
  - 增加登录态守卫（检测 Cookie）
  - 已登录时自动 `redirect` 到 `NEXT_PUBLIC_PORTAL_PATH`（默认 `/portal`）

- 新增：`app/portal/page.tsx`
  - 增加 Portal 占位页用于登录跳转闭环验证

### 3.2 Login 组件拆分

- 新增：`app/components/login/login-layout.tsx`
- 新增：`app/components/login/login-form.tsx`
- 新增：`app/components/login/email-field.tsx`
- 新增：`app/components/login/password-field.tsx`

实现内容：

- 左侧视觉区（背景图、Logo、Hero 文案）
- 右侧登录表单区
- 邮箱输入项与格式校验
- 密码输入项与眼睛图标显隐切换
- 提交状态与错误提示展示

### 3.3 样式与响应式

- 修改：`app/globals.css`
  - 新增 Login 设计 token（颜色、尺寸、表单高度、分栏比例）
  - 新增 Login 页面样式（双栏布局、输入框、按钮、错误态、焦点态）
  - 新增 `sm/md/lg` 断点适配策略（移动端单栏优先表单可用性）
  - 维持与 Landing 一致的品牌风格（主色蓝、0 圆角、边框风格）

### 3.4 静态资源

- 新增：`public/login/hero-bg.svg`
  - 作为 Login 左侧视觉背景资源

### 3.5 全局字体策略调整

- 修改：`app/layout.tsx`
  - 移除 `next/font/google` 的 `Geist` / `Geist Mono` 依赖
- 修改：`app/globals.css`
  - `--font-sans`、`--font-mono` 改为本地字体栈
  - 与 Landing Page 字体策略保持一致，避免构建时拉取 Google Fonts

## 4. 关键实现说明

1. Landing 到 Login 的入口连接保持不变：
   - Header 的 `Login` 按钮仍跳转 `/login`
   - Hero CTA 的 `Login` 按钮仍跳转 `/login`
2. 登录表单符合需求约束：
   - 邮箱必须合法，否则显示指定错误文案
   - 密码为空时禁用 `Sign In`
   - 支持密码明文/密文切换
3. 路由守卫支持登录后重访 `/login` 自动跳转 Portal。
4. 字体改造后不再依赖 Google Fonts 网络请求，降低构建环境要求。

## 5. 验证结果

- 已执行：`npm run lint`
  - 结果：无 error
  - 备注：存在既有 warning（`docs/skills/wcag/templates/main.js`），与本次 Login 变更无直接关联

- 已执行：`npm run build`
  - 结果：构建通过
  - 备注：去除 Google Fonts 后，未再出现字体下载失败问题

## 6. 已知事项

1. 当前登录提交流程为前端联调占位逻辑：
   - 提交成功后写入 `auth_token=demo-session` Cookie 并跳转 Portal
   - 后续需替换为真实鉴权 API 与会话策略
2. `/portal` 当前为占位页，仅用于登录后跳转闭环验证。
3. 生产环境建议显式配置：
   - `NEXT_PUBLIC_PORTAL_PATH`
   - `AUTH_COOKIE_NAME`（如需与后端会话键对齐）
