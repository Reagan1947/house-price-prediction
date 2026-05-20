# Landing / 全站可访问性增量变更记录（2026-05-17）

## 1. 变更概述

本次为 Landing 首页及全站主内容跳转链路的可访问性增量修复，目标对齐 `docs/skills/wcag/` 指南与审查结论，重点覆盖：

- `Skip to main content` 功能补齐与优化
- Landing 颜色对比度提升（AAA）
- Landing 头部交互目标尺寸修复（44x44）
- 首页位置语义从可见 `Home` 菜单调整为仅读屏提示

## 2. 代码变更清单

### 2.1 Skip Link 能力实现与优化

- 新增：`app/components/accessibility/skip-link.tsx`
  - 新增可复用 `SkipLink` 组件（客户端）
  - 点击后主动聚焦 `#main-content`，并滚动到主内容起始位置
  - 同步更新 URL hash 以保持语义一致

- 修改：`app/layout.tsx`
  - 在 `<body>` 内首个可聚焦位置挂载 `<SkipLink />`

- 修改：`app/page.tsx`
- 修改：`app/services/page.tsx`
- 修改：`app/valuation/page.tsx`
- 修改：`app/portal/page.tsx`
- 修改：`app/components/login/login-layout.tsx`
  - 各页面主内容容器统一补齐：`id="main-content"` + `tabIndex={-1}`
  - 确保 skip link 激活后可稳定落焦到主内容区域

### 2.2 Landing 导航位置语义调整

- 修改：`app/components/landing/landing-header.tsx`
  - 移除之前新增的可见 `Home` 导航项
  - 在 Logo 附近新增仅屏幕阅读器可见提示：`当前页：Home`
  - 保持现有可见导航结构不变（`Services` + `Login`）

### 2.3 样式与可访问性 Token 调整

- 修改：`app/globals.css`
  - Skip link 样式优化：默认离屏隐藏，`focus/focus-visible` 时显示
  - 新增 `#main-content { scroll-margin-top: 80px; }`，减轻固定头部遮挡
  - 新增通用 `.sr-only` 工具类
  - Landing 主色与焦点色调整为 `#0a48be`（提升对比度）
  - `.landing-btn-sm` 最小高度调整为 `44px`（满足目标尺寸）
  - 清理不再使用的 `.landing-nav-link[aria-current="page"]` 样式

## 3. WCAG 对应修复项

1. `2.4.1 Bypass Blocks (A)`
   - 新增并优化 skip link，支持直接跳转主内容。

2. `1.4.6 Contrast (AAA)`
   - Landing 关键按钮与文字颜色组合提升至 AAA 阈值。

3. `2.5.5 Target Size (AAA)`
   - Header 小按钮触控尺寸提升到 `44x44` 级别。

4. `2.4.8 Location (AAA)`
   - 首页保留现有可见导航结构，通过读屏可见文本补充“当前页”位置语义。

## 4. 验证结果

- 已执行：`npm run lint`
  - 结果：无 error
  - 备注：存在既有 warning（`docs/skills/wcag/templates/main.js`），与本次业务代码变更无直接关联。

- 已执行：`docs/skills/wcag/scripts/check_contrast.py`（关键色对）
  - Landing 主按钮白字/主蓝：通过 AAA
  - Outline 按钮蓝字/浅底：通过 AAA
  - Hover 态蓝字/浅底：通过 AAA

## 5. 说明

1. `docs/skills/wcag/scripts/validate_accessibility.sh` 在当前环境下受 `npx/pa11y` 安装异常影响，未完成完整自动审计。
2. 本次改动聚焦可访问性与导航语义，不改变现有业务路由与登录流程。
