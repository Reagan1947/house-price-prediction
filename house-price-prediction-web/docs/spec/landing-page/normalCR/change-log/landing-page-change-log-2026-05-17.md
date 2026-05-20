# Landing 页面变更记录（2026-05-17）

## 1. 变更概述

本次完成了 Landing 页面从设计产出到前端实现的完整落地，包含：

- 详细设计文档输出
- 开发任务文档输出
- Landing 页面组件化开发与样式实现
- Logo 与 Favicon 资源替换和站点元数据接入
- 移动端 Hero 居中与一致性优化

## 2. 文档变更

### 2.1 新增详细设计文档

- `docs/spec/landing-page/minorCR/detail-design/landing-page-detail-design.md`

内容包含：页面结构、视觉规范、响应式策略、路由交互、可访问性要求、实现与测试策略。

### 2.2 新增开发任务文档

- `docs/spec/landing-page/minorCR/task/landing-page-development-task.md`

内容包含：WBS（T0-T7）、里程碑、依赖关系、DoD、风险与检查清单。

## 3. 代码与资源变更

### 3.1 页面与组件

- 修改：`app/page.tsx`
  - 首页替换为 Landing 页面入口
  - Hero 标题更新为：`Efficiently Predict Your House Price`
  - `Predict Now` 跳转支持 `NEXT_PUBLIC_VALUATION_URL`（默认 `/valuation`）

- 新增：`app/components/landing/landing-header.tsx`
- 新增：`app/components/landing/landing-hero.tsx`
- 新增：`app/components/landing/landing-cta-group.tsx`

### 3.2 样式与响应式

- 修改：`app/globals.css`
  - 新增 Landing token（颜色、尺寸、字号等）
  - 实现 Header/Hero/CTA 样式
  - 统一全局字体为：
    - `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
  - 移动端（`max-width: 767px`）Hero 区域改为垂直居中
  - 移动端标题/描述/按钮样式向桌面规格靠齐
  - Logo 显示宽度调整为 `110px`

### 3.3 占位路由（用于当前阶段联调验证）

- 新增：`app/services/page.tsx`
- 新增：`app/login/page.tsx`
- 新增：`app/valuation/page.tsx`

### 3.4 Logo 资源替换

- Header Logo 当前使用：
  - `public/landing/logo.png`
- 附带保留：
  - `public/landing/logo.svg`

### 3.5 Favicon / PWA 资源接入

- 修改：`app/layout.tsx`
  - 配置 `metadata.icons`
  - 配置 `metadata.manifest`

- 修改：`app/favicon.ico`
- 新增：`public/favicon.svg`
- 新增：`public/favicon-96x96.png`
- 新增：`public/apple-touch-icon.png`
- 新增：`public/web-app-manifest-192x192.png`
- 新增：`public/web-app-manifest-512x512.png`
- 新增并修正：`public/site.webmanifest`
  - `name` 修正为 `House-Price-Prediction`

## 4. 关键实现说明

1. Landing 主体采用组件化拆分，增强可维护性和后续扩展能力。
2. CTA 组件支持内外链自动识别：
   - 站内路由使用 `next/link`
   - 外部链接自动附加 `target="_blank"` 与 `rel="noopener noreferrer"`
3. 移动端 Hero 使用 `100dvh` 与 flex 垂直居中，解决内容偏上问题。
4. 字体、Logo、Favicon 均按最新需求完成替换与统一。

## 5. 验证结果

- 已多次执行：`npm run lint`
- 结果：
  - 无 error
  - 存在既有 warning（位于 `docs/skills/wcag/templates/main.js`），与本次 Landing 变更无直接关联

## 6. 已知事项

1. `/services`、`/login`、`/valuation` 当前为占位页，用于联调与跳转闭环验证。
2. 若生产环境使用外部 valuation 系统，请在部署环境设置 `NEXT_PUBLIC_VALUATION_URL`。

