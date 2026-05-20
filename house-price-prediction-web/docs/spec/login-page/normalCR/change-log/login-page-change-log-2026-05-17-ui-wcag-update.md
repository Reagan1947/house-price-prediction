# Login 页面增量变更记录（2026-05-17）

## 1. 变更范围

本次为 Login 页面样式与可访问性增量优化，主要覆盖：

- 左侧 Hero 文案与 Logo 对齐及视觉微调
- 登录输入框替换为 shadcn UI Input 方案
- 输入图标替换为 lucide 标准图标
- 按 `docs/skills/wcag/` 文档完成关键 WCAG 问题修复
- 登录按钮文案调整为 `Log in`

## 2. 代码变更清单

### 2.1 组件与交互

- 修改：`app/components/login/login-layout.tsx`
  - 保持左侧视觉区结构，配合样式实现 Hero 与 Logo 左边界一致。

- 修改：`app/components/login/login-form.tsx`
  - 标题改为两行：`Hello !` / `Log in to your account`
  - 字段容器由 `div[role=group]` 调整为 `fieldset + legend`
  - 登录按钮文案从 `Sign In` 更新为 `Log in`

- 修改：`app/components/login/email-field.tsx`
  - 原生 `<input>` 替换为 shadcn `Input`
  - 图标替换为 `lucide-react` 的 `<Mail />`
  - 增加可见标签 `Email address`

- 修改：`app/components/login/password-field.tsx`
  - 原生 `<input>` 替换为 shadcn `Input`
  - 图标替换为 `lucide-react` 的 `<LockKeyhole />`
  - 密码显隐按钮改为输入框内叠加方案
  - 增加可见标签 `Password`

- 新增：`components/ui/input.tsx`
  - 引入标准 shadcn Input 组件实现

- 新增：`lib/utils.ts`
  - 新增 `cn(...)` 工具函数供 UI 组件合并类名

### 2.2 样式与设计 Token

- 修改：`app/globals.css`
  - 新增 `--login-visual-horizontal-padding`，统一 Logo 与 Hero 左对齐
  - Hero 文案宽度与字号微调：
    - `max-width` 调整为 `450px`
    - 标题与描述字体下调一档
  - 引入 shadcn 输入框适配样式：
    - `.login-input-shell`
    - `.login-input-icon`
    - `.login-input-shadcn`
    - `.login-visibility-toggle-shadcn`
  - 修复焦点态“底边变粗”问题（去除 inset 底部阴影叠加）
  - WCAG 对比度相关 token 调整：
    - `--login-color-primary: #0043ce`
    - `--login-color-primary-hover: #0039b8`
    - `--login-color-placeholder: #525252`
    - `--login-color-border: #767b91`
    - `--login-color-error: #8f1d21`
    - `--login-color-focus: #002d9c`
  - 触控目标修复：密码显隐按钮尺寸提升至 `44x44`

### 2.3 依赖变更

- 修改：`package.json`
  - 新增依赖：`lucide-react`

- 修改：`package-lock.json`
  - 同步锁文件更新

## 3. WCAG 修复项对应

本次针对上轮审查结论完成以下修复：

1. `3.3.2 Labels or Instructions`
   - 输入框补充可见文本标签（非仅 `sr-only`）。
2. `2.4.13 Focus Appearance (AAA)`
   - 输入框焦点改为明确 `2px` outline，且与非焦点态对比增强。
3. `1.4.6 Contrast (AAA)` / `1.4.11 Non-text Contrast (AA)`
   - 关键文字、按钮、边框、错误态、焦点色对比度提升至目标阈值以上。
4. `2.5.5 Target Size (AAA)`
   - 密码显隐按钮调整为 `44x44` 最小触控尺寸。
5. 语义增强
   - 账号输入组改为 `fieldset + legend`。

## 4. 验证结果

- 已执行：`npm run lint`
  - 结果：无 error
  - 备注：存在既有 warning（`docs/skills/wcag/templates/main.js`），与本次变更无直接关联

- 已执行：对比度快速复核（关键颜色组合）
  - 按钮白字/主蓝：`7.79:1`
  - 错误文本/背景：`8.21:1`
  - 输入边框/面板：`4.19:1`
  - 焦点色/面板：`11.32:1`

## 5. 说明

1. `docs/skills/wcag/scripts/validate_accessibility.sh` 在当前环境执行受限（`npx/pa11y` 权限问题），本次以代码审查 + 手工对比度校验为主。
2. 登录流程仍为前端联调占位逻辑（写入演示 Cookie 后跳转），后续可继续接入真实鉴权接口。
