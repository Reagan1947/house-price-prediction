# App Portal 页面开发任务文档（normalCR）

## 1. 任务目标

依据详细设计文档完成 App Portal（应用选择门户）开发，确保实现以下目标：

- 登录后可进入 Portal，并具备未登录拦截能力。
- Portal 包含 `Home Page` 与 `Application List` 两个子页面。
- 左侧导航可完成子页面切换且高亮状态正确。
- Home Page 三分区（Shortcut / Advice / Recently）按设计实现并具备 loading/empty/error 状态。
- Application List 可展示用户可访问应用并支持基础筛选。
- 页面满足基础响应式与可访问性要求。
- 代码符合当前工程规范并通过 lint。

关联文档：

- 需求：`docs/spec/app-portal/app-portal-requirements.md`
- 详细设计：`docs/spec/app-portal/normalCR/detail-design/app-portal-detail-design.md`

## 2. 范围与边界

### 2.1 In Scope

- `app/portal` 路由组页面开发（layout + Home + Application List）。
- Portal 相关组件拆分（`app/components/portal/`）。
- Portal 样式 token 与页面样式落地（`app/globals.css` 或局部样式文件）。
- Portal 数据模型、请求封装与状态管理（`lib/portal/*`）。
- Portal 路由守卫、导航高亮、错误重试与空态处理。

### 2.2 Out of Scope

- 后端权限系统与鉴权服务实现。
- Valuation / Analysis 业务应用内部功能实现。
- 通知中心、多语言、多主题与推荐算法。
- 复杂 BI 报表或运营统计模块。

## 3. 任务分解（WBS）

## 3.1 T0 - 开发准备与参数冻结

- 目标：冻结 Portal 开发输入，消除联调阻塞。
- 子任务：
  - 确认 Portal 主路由（默认 `/portal`）与子路由（`/portal/applications`）。
  - 确认登录态判定来源（cookie/session/token）与守卫策略。
  - 确认 Home / Applications 数据接口契约（字段、分页/筛选参数、错误码）。
  - 确认外链应用打开策略（同页/新页）。
- 产出：
  - 参数冻结记录（建议写入 PR 描述或 change-log）。
- 验收标准：
  - 无关键待确认项后进入开发阶段。

## 3.2 T1 - 路由骨架与登录守卫

- 目标：搭建 Portal 路由骨架并打通访问控制。
- 子任务：
  - 新增 `app/portal/layout.tsx`、`app/portal/page.tsx`、`app/portal/applications/page.tsx`。
  - 实现未登录访问 `/portal*` 跳转 `/login`。
  - 保证登录后可访问 Portal 首页。
- 产出：
  - Portal 路由可访问，守卫行为可验证。
- 验收标准：
  - 未登录用户无法停留在 `/portal*`。

## 3.3 T2 - Portal 布局与导航组件落地

- 目标：实现 Header + SideNav + Main Outlet 的通用外壳。
- 子任务：
  - 新增 `portal-header.tsx`（Logo、用户菜单）。
  - 新增 `portal-sidenav.tsx`（Home / Applications 菜单项、高亮态）。
  - 处理当前路由匹配与 `aria-current="page"`。
- 产出：
  - 可复用的 Portal 容器层与导航层。
- 验收标准：
  - 导航点击可切换路由；高亮状态正确且可感知。

## 3.4 T3 - Home Page 三分区实现

- 目标：完成 Home Page 的核心信息展示。
- 子任务：
  - 新增 `shortcut-section.tsx`，支持快捷应用卡片列表。
  - 新增 `advice-section.tsx`，支持建议卡片与 CTA。
  - 新增 `recently-section.tsx`，支持近期记录展示与 Reopen 操作。
  - 对齐关键文案、间距、卡片样式与分区标题层级。
- 产出：
  - Home 三分区页面与交互入口。
- 验收标准：
  - 三分区均可独立渲染，入口点击行为正确。

## 3.5 T4 - Application List 页面实现

- 目标：完成应用列表展示与基础筛选。
- 子任务：
  - 新增 `application-filter-bar.tsx`（关键词筛选，可选分类筛选）。
  - 新增 `application-grid.tsx`（卡片网格展示）。
  - 实现 `searchParams` 同步（支持可分享 URL）。
- 产出：
  - Application List 页面可用于应用发现与进入。
- 验收标准：
  - 用户可查看应用列表，并按关键词筛选结果。

## 3.6 T5 - 数据层与状态管理

- 目标：封装 Portal 数据请求并实现状态闭环。
- 子任务：
  - 新增 `lib/portal/types.ts`（`PortalApp`/`AdviceItem`/`RecentActivity`）。
  - 新增 `lib/portal/services.ts`（Home 与 Applications 请求封装）。
  - 实现 loading/empty/error/retry 状态。
  - 保证 Home 三分区可独立失败、不互相阻断。
- 产出：
  - 稳定的数据访问层与统一错误处理逻辑。
- 验收标准：
  - 网络异常与空数据场景有可理解反馈，且可重试。

## 3.7 T6 - 视觉样式与响应式适配

- 目标：实现与详细设计一致的视觉与断点行为。
- 子任务：
  - 落地 Portal 设计 token（颜色、尺寸、边框、布局）。
  - 对齐 Header 高度、SideNav 宽度、卡片样式（0 圆角 + 1px 边框）。
  - 实现 `sm/md/lg` 断点：
    - `lg` 侧栏常驻；
    - `md` 侧栏收缩或抽屉；
    - `sm` 单列内容与抽屉导航。
- 产出：
  - Portal 多端布局稳定且风格统一。
- 验收标准：
  - 375 / 768 / 1280 宽度无错位、遮挡、横向滚动。

## 3.8 T7 - 可访问性与安全基线

- 目标：满足 WCAG 基线和基础安全要求。
- 子任务：
  - 完整语义结构（`header/nav/main/section` + 标题层级）。
  - 补齐焦点可见、键盘可达、触控尺寸（>=44x44）。
  - 错误区添加 `role="alert"` 或 `aria-live`。
  - 外链应用增加 `rel="noopener noreferrer"`。
  - 避免在 URL/日志中暴露敏感信息。
- 产出：
  - A11y 与安全基线达标。
- 验收标准：
  - 键盘可完整操作核心流程；安全检查无明显风险。

## 3.9 T8 - 质量验证与交付

- 目标：完成自测、lint 与交付文档沉淀。
- 子任务：
  - 执行 `npm run lint`。
  - 手工测试：守卫、导航、三分区状态、应用筛选、断点适配。
  - 输出变更说明、已知限制与待确认项。
- 产出：
  - 可合并代码与验收记录。
- 验收标准：
  - lint 通过；测试项通过或有明确例外说明。

## 4. 里程碑与执行顺序

1. M1：完成 T0（参数冻结与接口假设确认）
2. M2：完成 T1 + T2（路由骨架、守卫、布局与导航）
3. M3：完成 T3 + T4（Home 三分区与 Application List）
4. M4：完成 T5 + T6（数据状态闭环与响应式视觉）
5. M5：完成 T7 + T8（A11y/安全验证与交付）

## 5. 任务依赖关系

- T1 依赖 T0（登录态与路径策略需明确）。
- T2 依赖 T1（路由骨架已建立）。
- T3/T4 依赖 T2（布局容器与导航可复用）。
- T5 依赖 T3/T4（页面结构稳定后接入数据层）。
- T6 可与 T5 并行，但需统一 token 命名。
- T7 依赖 T3/T4/T6 完成后统一验收。
- T8 依赖全部开发任务完成。

## 6. Definition of Done（DoD）

- 功能：
  - Portal 双子页可访问，导航切换正确，Home 三分区与 Application List 按设计可用。
- 状态：
  - loading/empty/error/retry 全部具备且行为正确。
- 视觉：
  - Header、SideNav、卡片风格与详细设计一致，响应式无明显回退。
- 工程：
  - 组件职责清晰、命名规范、无明显重复逻辑、`npm run lint` 通过。
- 可访问性与安全：
  - 键盘可达、焦点可见、语义完整、外链安全属性与敏感信息防泄露达标。

## 7. 风险与应对

1. `Application List` Figma 细节缺失风险
   - 应对：先按详细设计默认方案实现，拿到节点后进行像素级修订。
2. API 字段或排序规则变化风险
   - 应对：通过 `types.ts` + 适配层隔离后端变化。
3. 权限数据不一致导致入口可见性异常
   - 应对：以前端兜底展示 + 后端鉴权结果为准，增加错误提示与重试。
4. 移动端导航交互复杂度提升
   - 应对：优先实现抽屉导航最小闭环，后续再增强动画与手势。

## 8. 开发检查清单（执行时勾选）

- [ ] 已完成路径、守卫、接口契约冻结（T0）。
- [ ] 已完成 `app/portal` 路由骨架与守卫（T1）。
- [ ] 已完成 Portal Header / SideNav 组件（T2）。
- [ ] 已完成 Home 三分区组件与页面组装（T3）。
- [ ] 已完成 Application List 与筛选（T4）。
- [ ] 已完成 Portal 数据层与状态闭环（T5）。
- [ ] 已完成视觉 token 与响应式适配（T6）。
- [ ] 已完成可访问性与安全基线检查（T7）。
- [ ] 已完成 lint、自测与交付说明（T8）。
