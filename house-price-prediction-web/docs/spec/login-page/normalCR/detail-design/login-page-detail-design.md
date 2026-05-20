# Login 页面详细设计（normalCR）

## 1. 文档目标

基于以下输入，输出 Login 页可实施详细设计，作为前端开发、联调与验收依据：

- Figma：<https://www.figma.com/design/M2IiAGmNgLFwWveEkq3v5C/Untitled?node-id=2-206>
- 需求文档：`docs/spec/login-page/normalCR/requirements/login-page-requirements`
- 全局设计约束：`docs/global-info/deisgn.md`
- 全局技术约束：`docs/global-info/techo-design.md`
- 无障碍与安全参考：`docs/skills/wcag/references/*.md`

## 2. 范围定义

### 2.1 本次范围（In Scope）

- Login 页面单页开发（建议路由：`/login`）。
- 双栏布局：左侧品牌 Hero，右侧登录表单。
- 邮箱 + 密码登录表单交互。
- 密码可见性切换（眼睛图标）。
- 邮箱格式校验与错误提示。
- 未填写密码时禁用登录按钮。
- 已登录用户自动跳转 Portal（路由守卫）。
- 基础响应式适配（sm/md/lg）与 WCAG 基线实现。

### 2.2 非范围（Out of Scope）

- 后端鉴权接口实现细节。
- Portal 页面业务开发。
- 忘记密码、注册、多因子认证、SSO。
- 多语言切换。

## 3. 需求与设计基线

### 3.1 需求要点（来自需求文档）

- 页面左右分区：
  - 左侧为背景图 + 左上角 Logo + 底部 Hero 文案。
  - 右侧为登录主体（标题 + 表单）。
- Hero 文案：
  - 标题：`Predict Your House Price`
  - 描述：`Predict Your Home Price from Multiple Dimensions.`
- 账号字段使用邮箱，必须校验邮箱格式。
- 非邮箱时提示：
  - `Currently only email account login is supported, please enter a correct email address.`
- 未输入密码时，登录按钮不可点击。
- 密码输入框右侧眼睛图标可切换明文/密文。
- 后续能力：若用户已登录，直接进入 Portal 页面。

### 3.2 Figma 结构映射（关键节点）

- 画布：`2:206 (Login)`
- 页面主 Frame：`3:208 (LoginPage)`，约 `1996 x 1199`
- 左侧视觉区：`3:209`，宽 `797`
  - 背景图：`3:369`
  - Logo 容器：`3:363`
  - Hero 文案容器：`3:211`
- 右侧登录区：`3:221`
  - 表单主容器：`3:229`，宽 `510`
  - 标题：`3:230`, `3:233`
  - 表单：`3:236`
  - 登录按钮：`3:261`

### 3.3 全局约束吸收

- 技术栈：Next.js App Router + React + Tailwind CSS + Shadcn UI。
- 视觉基调：IBM Carbon 倾向（0 圆角、1px 边框、主色蓝 `#0f62fe`）。
- 可访问性：按 WCAG 指南实现（语义化、键盘可达、焦点可见、最小触控尺寸）。
- 安全：前端只做输入验证与安全输出，不在客户端存储敏感明文。

## 4. 信息架构与页面结构

```text
LoginPage (/login)
├─ LeftVisualSection
│  ├─ BrandLogo
│  └─ HeroBlock
│     ├─ HeroTitle
│     └─ HeroDescription
└─ RightAuthSection
   └─ LoginForm
      ├─ Heading (Hello! / Login ...)
      ├─ EmailField
      ├─ PasswordField
      │  └─ PasswordVisibilityToggle
      ├─ ValidationMessageArea
      └─ SubmitButton (Sign In)
```

## 5. 视觉与样式详细设计

### 5.1 设计 Token（建议）

```css
:root {
  --login-color-primary: #0f62fe;
  --login-color-primary-hover: #0353e9;
  --login-color-bg-right: #f5f6f8;
  --login-color-bg-panel: #ffffff;
  --login-color-text: #161616;
  --login-color-text-muted: #525252;
  --login-color-placeholder: #898a9e;
  --login-color-border: #c9cbda;
  --login-color-error: #da1e28;
  --login-color-focus: #0f62fe;

  --login-radius: 0px;
  --login-border-width: 1px;

  --login-left-width: 40%;
  --login-right-width: 60%;
  --login-form-width: 510px;
  --login-control-height: 50px;
}
```

### 5.2 布局规格（Desktop）

- 页面最小高度：`100dvh`。
- 主体双栏：左 40% / 右 60%（以 Figma 比例为基线，允许 2% 浮动）。
- 左侧：
  - 背景图铺满（`object-fit: cover`）。
  - Logo 位于左上（约距上 35px、左 36px）。
  - Hero 文案位于左下（约距左 60px、距底 60px）。
- 右侧：
  - 背景浅灰（接近 `#f5f6f8`），内容容器水平居中。
  - 表单容器宽 `510px`，视觉起始高度约在页面 25%~30%。

### 5.3 文本与控件规格

- 主标题（Hello!）：`28px`，`700`，行高 `40px`。
- 副标题（Login ...）：`28px`，`700`，行高 `40px`。
- 输入框：
  - 高 `50px`，左图标区 `55px`，右图标区 `48px`（密码项）。
  - 边框 `1px solid #c9cbda`，背景白，圆角 `0`。
- 占位文本：`14px`，`#898a9e`。
- 登录按钮：
  - 高 `50px`，宽 `100%`。
  - 背景 `#0f62fe`，白字，圆角 `0`。

## 6. 表单交互与状态设计

### 6.1 字段规则

- Email：
  - `type="email"`，必填。
  - 校验规则：非空 + RFC 兼容邮箱格式。
- Password：
  - 默认 `type="password"`，必填。
  - 点击眼睛图标切换 `password/text`。

### 6.2 按钮可用性规则

- 当 `password` 为空时：
  - `Sign In` 按钮禁用（`disabled` 或 `aria-disabled=true` + 逻辑拦截）。
- 当 `password` 非空时：
  - 按钮启用。

### 6.3 校验反馈规则

- 邮箱格式非法时：
  - 字段标记错误态（红色边框或底线 + 图标/文字，不仅靠颜色）。
  - 显示错误文案：
    - `Currently only email account login is supported, please enter a correct email address.`
- 错误触发时机：
  - `onBlur` 与 `onSubmit` 均触发。
- 错误清除：
  - 输入恢复合法后即时清除错误提示。

### 6.4 登录流程状态

- `idle`：初始可输入。
- `validating`：前端校验中。
- `submitting`：按钮 loading，不可重复提交。
- `success`：跳转 Portal。
- `error`：展示接口错误（通用错误区）。

## 7. 已登录跳转（路由守卫）

- 页面进入时检查登录态（优先服务端检查）。
- 若已登录：直接 `redirect('/portal')`（或由环境变量驱动路由）。
- 若未登录：渲染登录页。

建议配置：

- `NEXT_PUBLIC_PORTAL_PATH=/portal`

实现建议（Next.js App Router）：

- 在 `app/login/page.tsx` 使用服务端会话读取（cookie/session）。
- 兜底：客户端 hydration 后再次检查一次登录态，避免边缘场景闪屏。

## 8. 可访问性设计（WCAG 导向）

- 语义结构：`<main>`, `<section>`, `<form>`, `<label>`。
- 表单关联：
  - `label` 与 `input` 显式 `for/id` 绑定。
  - 错误信息使用 `aria-describedby` 关联字段。
  - 非法字段设置 `aria-invalid="true"`。
- 键盘支持：
  - Tab 顺序：Email -> Password -> 密码可见切换 -> Sign In。
  - 回车可提交（在可提交状态）。
- 焦点可见：
  - `:focus-visible` 至少 2px 明显轮廓，高对比。
- 触控目标：
  - 所有交互元素最小 `44x44px`。
- 错误播报：
  - 错误区建议 `role="alert"`，供屏幕阅读器及时播报。

## 9. 安全与鲁棒性设计

- 前端仅做输入合法性校验，服务端必须二次校验。
- 禁止将密码写入 URL、日志或本地持久化存储。
- 展示用户输入时使用安全输出（React 默认转义）。
- API 错误处理：
  - 网络错误、401、5xx 区分文案。
  - 通用异常走全局错误边界与日志上报。

## 10. 响应式设计

### 10.1 断点

- `sm`: `<768px`
- `md`: `768px~1023px`
- `lg`: `>=1024px`

### 10.2 断点行为

- `lg`：保持双栏布局，接近 Figma。
- `md`：
  - 左栏可缩至 35%，右栏 65%。
  - 表单宽度降至 `440px` 左右。
- `sm`：
  - 切为单栏，默认隐藏左背景图或改为顶部横幅图。
  - 登录区占满宽度，容器 `padding: 24px 16px`。
  - 输入框与按钮保持 `>=44px` 高度。

## 11. 前端实现设计（Next.js App Router）

### 11.1 文件规划（建议）

```text
app/
├─ login/
│  └─ page.tsx
├─ components/login/
│  ├─ login-layout.tsx
│  ├─ login-form.tsx
│  ├─ email-field.tsx
│  └─ password-field.tsx
└─ globals.css
```

### 11.2 组件职责

- `page.tsx`：登录态守卫 + 页面组装。
- `login-layout.tsx`：双栏布局与左侧视觉区域。
- `login-form.tsx`：状态管理、提交、错误展示。
- `email-field.tsx`：邮箱输入与错误展示。
- `password-field.tsx`：密码输入与明文切换。

### 11.3 状态管理建议

- 轻量场景：`useState` + 本地校验函数。
- 若已有统一表单方案，可接入 `react-hook-form + zod`。

## 12. 验收标准

- 视觉：
  - 桌面端左右布局、标题、输入框、按钮样式与 Figma 关键视觉一致。
- 功能：
  - 邮箱校验、密码必填禁用、密码显隐切换、登录提交行为正确。
  - 已登录用户自动跳转 Portal。
- 响应式：
  - sm/md/lg 无重叠、溢出、不可点击区域。
- 可访问性：
  - 键盘可达、焦点可见、错误可感知、触控尺寸达标。
- 工程：
  - `npm run lint` 通过。

## 13. 测试设计

### 13.1 手工测试

- 桌面（1280+）：视觉对齐、交互链路。
- 平板（768~1023）：字段与按钮布局稳定。
- 手机（375/390/430）：可读性、可点击性、无横向滚动。
- 键盘测试：Tab 顺序、Enter 提交、错误聚焦。

### 13.2 用例清单（核心）

1. 输入非法邮箱 + 有密码 -> 阻止提交并显示指定错误文案。
2. 输入合法邮箱 + 空密码 -> 登录按钮禁用。
3. 输入合法邮箱 + 有密码 -> 允许提交。
4. 点击眼睛图标 -> 密码在明文/密文间切换。
5. 模拟已登录状态进入 `/login` -> 自动跳转 `/portal`。

## 14. 风险与待确认项

1. 文案一致性：
   - Figma 存在 `Prediction Your House`/`Login in to your account` 文案，需求文档存在不同写法。
   - 建议：以需求文档文案为主，Figma 文案作为排版参考。
2. Portal 路由最终值：
   - 需产品/后端确认统一入口（`/portal` 或外部系统 URL）。
3. 登录接口返回码规范：
   - 需明确错误码到提示文案映射表（401/423/429/5xx）。

## 15. 实施顺序建议

1. 先完成路由守卫与页面骨架。
2. 完成表单组件与校验逻辑。
3. 完成视觉精修与响应式。
4. 补全无障碍细节与错误状态。
5. 执行 lint 与手工测试后交付。
