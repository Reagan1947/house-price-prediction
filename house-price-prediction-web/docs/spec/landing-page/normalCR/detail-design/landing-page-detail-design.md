# Landing 页面详细设计（minorCR）

## 1. 文档目标

基于以下输入，输出 Landing 页的可实施详细设计，作为前端开发与联调依据：

- Figma: https://www.figma.com/design/M2IiAGmNgLFwWveEkq3v5C/Untitled?node-id=0-1
- 需求文档: `docs/spec/landing-page/minorCR/requirements/landing-page-requirements.md`
- 全局设计约束: `docs/global-info/deisgn.md`
- 全局技术约束: `docs/global-info/techo-design.md`
- 无障碍与响应式参考: `docs/skills/wcag/references/*.md`

## 2. 范围定义

### 2.1 本次范围（In Scope）

- Landing 页单页面开发（`/`）。
- 顶部导航区域（Logo、Services、Login）。
- Hero 区域（标题、描述、双 CTA 按钮组）。
- 跳转行为（Services / Login / Predict Now）。
- 基础响应式适配（sm/md/lg）。
- WCAG 导向的可访问性实现（键盘可达、语义、焦点可见、触控尺寸）。

### 2.2 非范围（Out of Scope）

- Services、Login、House Price Valuation 目标页面的业务开发。
- 用户鉴权流程与后端接口联调。
- 多语言与 CMS 配置。

## 3. 需求与设计基线

### 3.1 需求要点

- Header：左侧网站 Icon，右侧 Services 入口 + Login 按钮。
- Main：浅色渐变背景 + Hero 文案。
- 按钮：
  - `Predict Now`：跳转 House Price Valuation 应用。
  - `Login`：跳转 Login 页面。

### 3.2 Figma 结构映射（关键节点）

- 画布：`0:1 (Landing)`
- 页面主 Frame：`2:4 (Main-Page)`，1280x635
- 导航栏：`2:120`，高度约 64
- Hero 区域：`2:45`，1280x627（浅蓝渐变）
- Hero 内容容器：`2:200`，431x283
- 主标题：`2:157`
- 描述：`2:158`
- CTA 组合：`2:170` / `2:201` / `2:205`

### 3.3 全局约束吸收

- 技术栈：Next.js App Router + React + Tailwind CSS（v4）。
- UI 风格：遵循 IBM Carbon 倾向（0 圆角、1px 边框、主色蓝 `#0f62fe`、轻量背景）。
- 无障碍：按 WCAG 指南实现（至少覆盖键盘可达、语义标签、焦点可见、触控目标 >=44px）。

## 4. 信息架构与页面结构设计

```text
LandingPage (/)
├─ Header
│  ├─ BrandLogo (click -> /)
│  └─ NavActions
│     ├─ ServicesLink (-> /services)
│     └─ LoginButton (-> /login)
└─ HeroSection
   ├─ HeroTitle
   ├─ HeroDescription
   └─ HeroCTAGroup
      ├─ PredictNowButton (-> Valuation URL)
      └─ LoginOutlineButton (-> /login)
```

## 5. 视觉与样式详细设计

### 5.1 设计 Token（建议落地到 `globals.css`）

```css
:root {
  --lp-color-primary: #0f62fe;
  --lp-color-text: #161616;
  --lp-color-text-secondary: #525252;
  --lp-color-bg: #f9f9f9;
  --lp-color-bg-gradient-mid: #dbe1ff;
  --lp-color-bg-gradient-end: #f3f3f4;
  --lp-color-white: #ffffff;
  --lp-color-border: #0f62fe;

  --lp-header-height: 64px;
  --lp-container-max: 1280px;
  --lp-content-left: 88px;

  --lp-font-title: 48px;
  --lp-font-body: 13px;
  --lp-font-btn: 14px;
}
```

### 5.2 布局规格（桌面）

- Header：
  - 高度 `64px`，横向两端对齐。
  - 左侧 Logo 容器宽约 `125px`，右侧操作区宽约 `201px`。
- Hero：
  - 顶部紧接 Header，最小高度 `calc(100vh - 64px)`，不足时保持视觉留白。
  - 背景渐变：`linear-gradient(153.9deg, #f9f9f9 0%, #dbe1ff 50%, #f3f3f4 100%)`。
  - 内容块左侧偏移约 `88px`，垂直偏移约 `175px`（大屏可改为居中偏上策略，避免绝对定位硬编码）。

### 5.3 组件样式规格

- Hero 标题：
  - 字号 `48px`，行高 `1.05~1.2`，字重 `400`。
  - 颜色 `#161616`。
- Hero 描述：
  - 字号 `13px`，行高 `20px`，颜色 `#161616`。
  - 最大宽度 `431px`。
- CTA 组合：
  - 高度 `44px`，左右按钮拼接为一组。
  - `Predict Now`：实心蓝底白字。
  - `Login`：白底蓝色 1px 边框 + 蓝字 + 右箭头。
  - 两按钮均保持 `border-radius: 0`。

## 6. 响应式设计

### 6.1 断点

- `sm`: `<768px`
- `md`: `768px~1023px`
- `lg`: `>=1024px`

### 6.2 各断点策略

- `lg`（桌面）：
  - 维持 Figma 主布局，标题单行/两行可读。
- `md`（平板）：
  - Hero 左边距从 `88px` 缩减到 `40px~48px`。
  - 标题缩放到 `40px` 左右。
- `sm`（手机）：
  - Header 采用紧凑横排，保留 Services/Login 可见；必要时缩小按钮内边距。
  - Hero 内容改为常规流式布局：`padding: 24px 16px 48px`。
  - 标题 `30~34px`，描述 `14~16px`（提升移动端可读性）。
  - CTA 仍保持双按钮并排；若宽度不足，允许换行但按钮高度不低于 `44px`。

## 7. 交互与路由详细设计

### 7.1 跳转规则

- 点击 `Services` -> `/services`
- 点击 `Login`（Header / Hero）-> `/login`
- 点击 `Predict Now` -> House Price Valuation 应用地址

### 7.2 Valuation 地址策略

- 推荐使用环境变量解耦：
  - `NEXT_PUBLIC_VALUATION_URL`
- 规则：
  - 若为站内路由，使用 `next/link`。
  - 若为外部系统 URL，使用 `<a>` 并设置 `target`/`rel`（按产品要求决定是否新开页）。

### 7.3 状态与动效

- Hover：
  - 主按钮亮度微调（如 `brightness(0.95)`）。
  - 描边按钮背景可轻微着色（如 `#edf3ff`）。
- Focus-visible：
  - 明确 `2px` 焦点环，确保键盘导航可视。
- Active：
  - 保持颜色层级，避免过度动画。

## 8. 可访问性设计（WCAG 导向）

- 语义结构：
  - 使用 `<header>`, `<nav>`, `<main>`, `<h1>`, `<p>`。
- 键盘可达：
  - 所有 CTA 可通过 `Tab` 获取焦点并触发。
- 焦点可见：
  - 使用 `:focus-visible` 显示高对比轮廓。
- 触控尺寸：
  - 按钮最小可点击区域 `44x44px`。
- 对比度：
  - 主按钮白字/蓝底、正文黑字/浅底需满足 WCAG 对比要求。
- 可读性：
  - 正文区块控制在合理行宽（建议 <= 80 字符）。

## 9. 前端实现设计（Next.js App Router）

### 9.1 文件规划

```text
app/
├─ page.tsx                  # Landing 页入口
├─ globals.css               # 设计 token 与全局基础样式
└─ components/landing/       # 新增（建议）
   ├─ landing-header.tsx
   ├─ landing-hero.tsx
   └─ landing-cta-group.tsx
```

### 9.2 组件职责

- `page.tsx`：
  - 组装 Header + Hero，管理页面级 metadata。
- `landing-header.tsx`：
  - Logo 与导航行为。
- `landing-hero.tsx`：
  - 标题/描述内容与布局。
- `landing-cta-group.tsx`：
  - `Predict Now` / `Login` 统一按钮交互。

### 9.3 渲染策略

- 页面为静态内容，可采用 Server Component 直出。
- 无需客户端状态时避免 `use client`，降低 JS 体积。

### 9.4 Metadata

- `title`: `House Price Prediction`
- `description`: 与 Hero 描述一致或精简 SEO 文案。

## 10. 验收标准

- 视觉：
  - 桌面端与 Figma 关键布局一致（Header、Hero、CTA 组合）。
- 功能：
  - 3 个入口（Services/Login/Predict Now）均按规则跳转。
- 响应式：
  - sm/md/lg 下无布局错位与文字遮挡。
- 可访问性：
  - 键盘可导航、焦点可见、按钮触控区域达标。
- 工程：
  - `npm run lint` 通过。

## 11. 测试设计

### 11.1 手工测试

- 桌面（>=1280）：对照 Figma 检查间距、字号、按钮样式。
- 平板（768~1023）：检查标题换行、按钮对齐。
- 手机（375 / 390 / 430）：检查可读性、点击区域、换行策略。
- 键盘测试：`Tab` 顺序、`Enter/Space` 触发。

### 11.2 自动化建议（后续）

- 增加 Playwright e2e：
  - 首页渲染成功
  - 关键按钮可见并可点击
  - 跳转地址正确

## 12. 风险与待确认项

1. 文案差异：
   - Figma 标题为 `Auto Predict Your House Price`，需求文档标题为 `Efficiently predict your house price`。
   - 建议：以需求文档为准，或由产品最终确认后固化。
2. Services 路由是否已存在：
   - 若 `/services` 未实现，需先提供占位页或临时跳转策略。
3. Valuation 跳转是否同域：
   - 若跨系统，需确定是否新开页与鉴权透传方案。

## 13. 实施顺序建议

1. 先落地页面骨架与语义结构（Header/Hero/CTA）。
2. 再做视觉精修（渐变、字号、间距、边框）。
3. 最后补齐响应式与可访问性检查并执行 `lint`。

