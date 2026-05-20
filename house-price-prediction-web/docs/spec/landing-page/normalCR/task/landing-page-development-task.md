# Landing 页面开发任务文档（minorCR）

## 1. 任务目标

依据详细设计文档完成 Landing 页面开发，确保实现以下目标：

- 页面视觉与 Figma 保持一致（Header + Hero + CTA）。
- 页面交互满足需求（Services / Login / Predict Now 跳转）。
- 页面满足基础响应式与可访问性要求。
- 代码符合当前工程规范并通过 lint。

关联文档：

- 需求：`docs/spec/landing-page/minorCR/requirements/landing-page-requirements.md`
- 详细设计：`docs/spec/landing-page/minorCR/detail-design/landing-page-detail-design.md`

## 2. 范围与边界

### 2.1 In Scope

- `app/page.tsx` Landing 页面开发与替换。
- Landing 相关组件拆分（`app/components/landing/`）。
- `app/globals.css` 中 Landing 相关 token 与样式补充。
- Landing 跳转地址配置（`NEXT_PUBLIC_VALUATION_URL`）。

### 2.2 Out of Scope

- `/services`、`/login`、valuation 目标系统的业务页面开发。
- 鉴权流程与接口联调。
- 国际化、多主题切换。

## 3. 任务分解（WBS）

## 3.1 T0 - 开发准备

- 目标：统一输入与参数，消除实施阻塞。
- 子任务：
  - 确认文案最终版本（标题、描述）。
  - 确认 `Predict Now` 的目标 URL 与打开方式（同页/新页）。
  - 确认 `/services`、`/login` 路由策略（真实页或临时占位）。
- 产出：
  - 参数确认记录（可写在 PR 描述或 change-log）。
- 验收标准：
  - 无未决阻塞项后再进入开发阶段。

## 3.2 T1 - 页面骨架与语义结构

- 目标：完成可访问语义结构与主布局骨架。
- 子任务：
  - 实现 `header/nav/main` 语义标签。
  - 在 `app/page.tsx` 组装 Landing 页面主结构。
  - 设置页面 metadata（title/description）。
- 产出：
  - 页面结构可渲染，基础文案可见。
- 验收标准：
  - DOM 结构满足语义要求；
  - 键盘可遍历核心链接与按钮。

## 3.3 T2 - 组件拆分与职责落地

- 目标：将 Landing 页面按详细设计拆分为可维护组件。
- 子任务：
  - 新增 `app/components/landing/landing-header.tsx`。
  - 新增 `app/components/landing/landing-hero.tsx`。
  - 新增 `app/components/landing/landing-cta-group.tsx`。
  - 在 `app/page.tsx` 完成组件组装。
- 产出：
  - 组件化代码结构，职责清晰。
- 验收标准：
  - 无重复样式逻辑；
  - 组件命名、目录结构与详细设计一致。

## 3.4 T3 - 视觉样式实现（桌面优先）

- 目标：实现与 Figma 对齐的核心视觉。
- 子任务：
  - 在 `app/globals.css` 落地 Landing token（颜色、字号、尺寸）。
  - 实现 Header 高度、布局、按钮样式（0 圆角 + 1px 边框风格）。
  - 实现 Hero 渐变背景、文案区域、CTA 拼接样式。
- 产出：
  - 桌面端视觉基本对齐。
- 验收标准：
  - 1280 宽度下关键区域（Header/Hero/CTA）与 Figma 匹配；
  - 主按钮与描边按钮样式符合规范。

## 3.5 T4 - 交互与路由行为实现

- 目标：打通页面跳转行为。
- 子任务：
  - `Services` -> `/services`
  - `Login`（Header/Hero）-> `/login`
  - `Predict Now` -> `NEXT_PUBLIC_VALUATION_URL`
  - 外链场景补充 `rel` 安全属性（若新开页）。
- 产出：
  - 3 处导航入口行为可用。
- 验收标准：
  - 点击行为与需求一致；
  - 不出现空链接或无响应点击。

## 3.6 T5 - 响应式适配（sm/md/lg）

- 目标：确保不同设备宽度下布局稳定。
- 子任务：
  - `lg` 保持 Figma 桌面布局。
  - `md` 调整 Hero 左偏移与标题缩放。
  - `sm` 改为流式布局，保证文本可读与按钮可点。
- 产出：
  - 三断点布局适配完成。
- 验收标准：
  - 375 / 768 / 1280 宽度下无溢出、遮挡、重叠。

## 3.7 T6 - 可访问性增强

- 目标：满足详细设计中定义的 WCAG 基线要求。
- 子任务：
  - 实现 `:focus-visible` 明显焦点样式。
  - 确保按钮/链接触控目标 >= 44x44px。
  - 校验颜色对比与可读性。
  - 确认键盘导航顺序符合视觉与语义顺序。
- 产出：
  - A11y 基线达标。
- 验收标准：
  - Tab 可完整访问关键交互；
  - 焦点可见，不丢失。

## 3.8 T7 - 质量验证与交付

- 目标：完成自测、lint 与交付说明。
- 子任务：
  - 运行 `npm run lint`。
  - 进行手工断点与交互测试。
  - 输出变更说明与已知限制（如路由占位）。
- 产出：
  - 可合并代码与验收记录。
- 验收标准：
  - lint 通过；
  - 测试项全部通过或有明确例外说明。

## 4. 里程碑与执行顺序

1. M1：完成 T0（参数确认，解除阻塞）
2. M2：完成 T1 + T2（结构与组件落地）
3. M3：完成 T3 + T4（视觉 + 交互）
4. M4：完成 T5 + T6（响应式 + 可访问性）
5. M5：完成 T7（验证与交付）

## 5. 任务依赖关系

- T1 依赖 T0。
- T2 可与 T3 并行推进，但需统一 token 命名。
- T4 依赖 T0 中 URL/路由确认。
- T6 依赖 T3/T5 完成后统一验收。
- T7 依赖全部开发任务完成。

## 6. Definition of Done（DoD）

- 功能：
  - Landing 页面按设计可访问，3 个核心入口行为正确。
- 视觉：
  - 桌面端与 Figma 关键视觉一致，移动端无明显错位。
- 工程：
  - 组件结构清晰、无冗余样式、`npm run lint` 通过。
- 可访问性：
  - 语义结构、焦点可见、键盘可达、触控尺寸达标。
- 文档：
  - 任务状态与风险项有记录，便于 CR 验收。

## 7. 风险与应对

1. 文案冲突风险（Figma vs 需求）
   - 应对：以需求文档为默认基线，最终由产品确认后冻结。
2. 路由未就绪风险（`/services`、`/login`）
   - 应对：先接占位路由或临时跳转策略，并在交付说明中标注。
3. 外部 valuation 地址不稳定
   - 应对：通过环境变量注入，避免硬编码。

## 8. 开发检查清单（执行时勾选）

- [ ] 已确认文案与跳转地址（T0）。
- [ ] 已完成语义结构与页面骨架（T1）。
- [ ] 已完成组件拆分与组装（T2）。
- [ ] 已完成桌面视觉实现（T3）。
- [ ] 已完成跳转逻辑实现（T4）。
- [ ] 已完成 sm/md/lg 适配（T5）。
- [ ] 已完成可访问性基线检查（T6）。
- [ ] 已完成 lint + 手工测试 + 交付说明（T7）。

