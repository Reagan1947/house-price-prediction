# Valuation App 页面开发任务文档（normalCR）

## 1. 任务目标

依据详细设计文档完成 House-Price Valuation 应用开发，确保实现以下目标：

- 应用可通过 `/portal` 的 `Shortcut` 与 `/portal/applications` 入口访问。
- Valuation 应用包含 `Prediction`、`History`、`Comparation Tool` 三个子页面。
- 用户可创建预测、查看并管理历史预测记录。
- 用户可选择历史记录并生成雷达图与房价对比图。
- 页面满足基础响应式与可访问性要求。
- 代码符合当前工程规范并通过 lint。

关联文档：

- 需求：`docs/spec/valuation-app/normalCR/requiremenmts/valuation-app-requirements.md`
- 详细设计：`docs/spec/valuation-app/normalCR/detail-design/valuation-app-detail-design.md`
- Portal 详细设计：`docs/spec/app-portal/normalCR/detail-design/app-portal-detail-design.md`

## 2. 范围与边界

### 2.1 In Scope

- `app/valuation` 路由与子页面切换（query `tab`）。
- Valuation 壳层、左导航与主内容区组件开发。
- Prediction 列表页、筛选区、行级操作。
- Create Prediction 弹窗与预测流程。
- History 记录页（筛选、分页、复用、删除、加入对比）。
- Comparison Tool（样本选择、雷达图、价格对比图）。
- Valuation 数据模型、服务层、校验器与状态管理。
- Portal 到 Valuation 的入口映射调整与兼容。

### 2.2 Out of Scope

- 真实模型训练、部署与 MLOps。
- 后端鉴权体系与权限系统改造。
- 报表导出引擎（PDF/Excel 高级模板）。
- 多租户主题与国际化完整改造。

## 3. 任务分解（WBS）

## 3.1 T0 - 开发准备与参数冻结

- 目标：冻结实施参数，消除联调阻塞。
- 子任务：
- 确认 `tab` 路由策略（`prediction|history|comparison`）及兼容参数映射（`mode/view/predictionId`）。
- 确认预测接口、列表接口、对比接口契约（字段、分页、错误码）。
- 确认图表库选型（建议沿用当前项目依赖或新增经批准依赖）。
- 确认中英文文案规范，修正 Figma 拼写错误对外展示策略。
- 产出：参数冻结记录。
- 验收标准：无关键待确认项后进入开发。

## 3.2 T1 - Portal 入口对接与路由骨架

- 目标：打通进入 Valuation 的入口和主路由。
- 子任务：
- 保持 `/valuation` 作为主入口并实现 `tab` 解析。
- 校正 Portal 中 Valuation/Analysis 的 `href` 映射策略。
- 兼容旧参数：`/valuation?mode=analysis`、`/valuation?view=compare`。
- 产出：可通过两个 Portal 入口进入目标子页。
- 验收标准：入口可访问，参数兼容行为符合设计。

## 3.3 T2 - Valuation 壳层与导航组件

- 目标：实现可复用的应用壳层与左导航。
- 子任务：
- 新增 `valuation-shell`、`valuation-sidenav` 组件。
- 导航项实现：`Home Page`、`Prediction`、`History`、`Comparation Tool`。
- 导航高亮与 `aria-current="page"`。
- 产出：Valuation 页面结构稳定，导航切换可用。
- 验收标准：导航可切页且高亮状态正确。

## 3.4 T3 - Prediction 页面（筛选 + 表格）

- 目标：完成预测列表核心工作台。
- 子任务：
- 实现页面标题、副文案、筛选区、`Create Prediction` 按钮。
- 实现表格列渲染与排序/分页骨架。
- 实现行级操作：`View`、`Edit`、`Delete`、`Select for Compare`。
- 实现 loading/empty/error/retry 状态。
- 产出：Prediction 页面可管理预测记录。
- 验收标准：筛选、列表展示、行操作入口可用。

## 3.5 T4 - Create Prediction 弹窗与预测流程

- 目标：完成从输入到预测再保存的闭环。
- 子任务：
- 实现 `Create New House Price Prediction` 弹窗结构。
- 实现 7 个特征字段与 `Title` 字段校验规则。
- 实现 `Predict House Price` 调用与结果回填。
- 实现 `Save/Cancel` 流程与脏数据离开确认。
- 产出：新建预测流程可独立完成。
- 验收标准：预测成功前不可保存；保存后列表可见新记录。

## 3.6 T5 - History 页面

- 目标：完成历史记录管理能力。
- 子任务：
- 实现 History 列表、筛选、分页与默认排序。
- 实现 `View`、`Reuse`、`Delete`、`Select for Compare`。
- 实现从 `predictionId` 参数直达指定记录。
- 产出：历史记录可查询、复用、删除、加入对比。
- 验收标准：核心管理操作闭环可用。

## 3.7 T6 - Comparison Tool 页面

- 目标：完成对比分析可视化能力。
- 子任务：
- 实现样本选择区（2~5 条记录）和已选管理。
- 实现雷达图（7 维特征）与价格对比图。
- 实现图例开关、tooltip、空状态引导。
- 提供图表的可访问替代表格数据。
- 产出：可视化对比页面可用于分析。
- 验收标准：两类图均能展示且交互正确。

## 3.8 T7 - 数据层与状态管理

- 目标：建立稳定的数据访问与状态闭环。
- 子任务：
- 新增 `lib/valuation/types.ts`、`services.ts`、`validators.ts`、`mappers.ts`。
- 封装预测、新建、列表、删除、对比请求。
- 统一错误处理与重试逻辑。
- 设计 mock 与真实接口切换策略。
- 产出：前端与后端契约解耦、状态统一。
- 验收标准：网络异常与空数据均有可理解反馈。

## 3.9 T8 - 视觉样式与响应式适配

- 目标：对齐设计风格并保证多端可用。
- 子任务：
- 落地 valuation token，并复用 portal 设计语言。
- 对齐表格、筛选、弹窗、按钮、图表容器样式。
- 实现 `sm/md/lg` 断点适配与移动端表格降级策略。
- 产出：视觉统一、布局稳定。
- 验收标准：375/768/1280 宽度无明显错位或横向溢出。

## 3.10 T9 - 可访问性与安全基线

- 目标：满足 WCAG 与前端安全基线。
- 子任务：
- 补齐语义结构、键盘可达、焦点可见。
- 表单错误关联 `aria-invalid` 与 `aria-describedby`。
- 弹窗焦点陷阱、ESC 关闭、焦点返回。
- 防止敏感数据在 URL/日志中泄露。
- 产出：A11y 和安全检查通过。
- 验收标准：键盘可完整完成核心流程，无明显安全风险。

## 3.11 T10 - 质量验证与交付

- 目标：完成自测、lint 和交付沉淀。
- 子任务：
- 运行 `npm run lint`。
- 手工测试 Prediction/History/Comparison 全流程。
- 校验 Portal 两入口跳转与兼容参数行为。
- 输出变更说明、已知限制、待确认项。
- 产出：可合并代码与验收记录。
- 验收标准：lint 通过；测试项通过或有明确例外说明。

## 4. 里程碑与执行顺序

1. M1：完成 T0（参数冻结）
2. M2：完成 T1 + T2（入口、路由与壳层）
3. M3：完成 T3 + T4（Prediction 与新建预测）
4. M4：完成 T5 + T6（History 与 Comparison）
5. M5：完成 T7 + T8（数据层与响应式视觉）
6. M6：完成 T9 + T10（A11y/安全验证与交付）

## 5. 任务依赖关系

- T1 依赖 T0。
- T2 依赖 T1。
- T3 依赖 T2。
- T4 依赖 T3 与 T7 的接口封装。
- T5 依赖 T7。
- T6 依赖 T5 与 T7。
- T8 可与 T3/T4/T5/T6 并行推进，但需统一 token 命名。
- T9 依赖主要交互页面开发完成后统一验收。
- T10 依赖全部开发任务完成。

## 6. Definition of Done（DoD）

- 功能：
- 从 Portal 两入口可进入 Valuation，且路由兼容策略生效。
- Prediction、History、Comparison 三页核心功能可用。
- Create Prediction 可完成预测与保存闭环。
- 状态：
- loading/empty/error/retry 覆盖关键模块。
- 视觉：
- 与详细设计风格一致，响应式无明显回退。
- 工程：
- 组件职责清晰、命名规范、数据层解耦、`npm run lint` 通过。
- 可访问性与安全：
- 键盘可达、焦点可见、语义完整、敏感信息不外泄。

## 7. 风险与应对

1. Figma 文案与字段拼写不规范风险。
- 应对：对外文案规范化，内部字段按标准 snake_case/camelCase 映射。
2. 对比图量纲不一致导致误读风险。
- 应对：雷达图使用标准化值，tooltip 同步展示原始值。
3. 列表字段较多导致移动端可读性差风险。
- 应对：sm 断点降级为记录卡片，保留关键字段。
4. 后端接口未就绪风险。
- 应对：先接 mock 服务，接口适配层隔离后端变动。

## 8. 开发检查清单（执行时勾选）

- [ ] 已完成参数冻结与接口假设确认（T0）。
- [ ] 已完成 Portal 入口对接与路由兼容（T1）。
- [ ] 已完成 Valuation 壳层与左导航（T2）。
- [ ] 已完成 Prediction 筛选与表格（T3）。
- [ ] 已完成 Create Prediction 弹窗与保存流程（T4）。
- [ ] 已完成 History 页面（T5）。
- [ ] 已完成 Comparison Tool 与两类图表（T6）。
- [ ] 已完成 valuation 数据层与校验器（T7）。
- [ ] 已完成样式对齐与响应式适配（T8）。
- [ ] 已完成可访问性与安全基线检查（T9）。
- [ ] 已完成 lint、自测与交付说明（T10）。
