# Compare Tool 开发任务文档（normalCR）

## 1. 任务目标

依据 Compare Tool 详细设计完成开发拆分，确保实现以下目标：

- 用户可在 `/valuation?tab=comparison` 进入 Compare Tool。
- 用户可通过弹窗搜索、筛选并选择 2~5 条预测记录。
- 用户确认选择后，页面展示已选数据摘要，并支持移除、清空、重新选择。
- 用户可查看比对结果视图：特征雷达图、预测价格对比图、等价数据表。
- Compare Tool 可复用 Prediction / History 已加入的对比选择状态。
- 页面满足基础响应式、可访问性、安全与鲁棒性要求。
- 代码符合当前工程规范并通过 lint。

关联文档：

- 需求：`docs/spec/compare-tool/normalCR/requirements/compare-tool.md`
- 详细设计：`docs/spec/compare-tool/normalCR/detail-design/compare-tool-detail-design.md`
- Valuation 详细设计：`docs/spec/valuation-app/normalCR/detail-design/valuation-app-detail-design.md`

## 2. 范围与边界

### 2.1 In Scope

- Compare Tool 页面结构调整与组件拆分。
- 选择弹窗（搜索、筛选、候选表格、临时选择、确认）。
- 已选摘要区（数量、记录摘要、移除、清空、重新选择）。
- 比对结果区（雷达图、价格图、数据表）。
- 对比选择状态与 Prediction / History 选择入口联动。
- Compare Tool 相关类型、筛选工具、映射工具与服务封装。
- loading、empty、no-result、error、selection-invalid 等状态。
- 响应式样式、键盘操作与 WCAG 基线。
- 手工测试、自动化测试建议与交付检查。

### 2.2 Out of Scope

- 后端预测模型、训练与模型解释能力。
- 跨用户共享对比方案、收藏对比方案。
- PDF/Excel 报表导出。
- 多语言、多币种汇率换算。
- 大数据量服务端高级检索优化，首版可复用现有 `/api/predictions`。

## 3. 任务分解（WBS）

## 3.1 T0 - 开发准备与参数冻结

- 目标：冻结 Compare Tool 实施输入，避免实现中反复调整。
- 子任务：
  - 确认对外文案使用 `Comparation Tool` 还是 `Comparison Tool`。
  - 确认首版选择状态是否写入 URL；默认不写入 URL。
  - 确认可比对记录规则：必须存在 `predictedPrice`。
  - 确认选择数量限制：最少 2 条、最多 5 条。
  - 确认首版接口复用 `/api/predictions`，后端不支持的特征筛选由前端补充。
- 产出：
  - 参数冻结记录，可写入 PR 描述或 change-log。
- 验收标准：
  - 文案、数量限制、接口假设、可比对规则无关键待确认项。

## 3.2 T1 - 现有 Compare Tool 结构梳理与无行为重构

- 目标：在不改变现有行为的前提下，为后续弹窗和结果视图拆分打基础。
- 子任务：
  - 梳理 `comparison-page.tsx` 现有职责：选择、图表、数据表混合逻辑。
  - 新增 `comparison-result-view.tsx`，承接结果区渲染。
  - 新增 `comparison-data-table.tsx`，承接等价数据表。
  - 保持 `ComparisonRadarChart` 与 `ComparisonPriceChart` 外部 API 稳定。
  - 确保现有选择 2 条后展示图表的行为不变。
- 产出：
  - 结果视图和数据表完成组件拆分。
- 验收标准：
  - 重构前后功能表现一致，图表和数据表仍可正常展示。

## 3.3 T2 - 已选摘要区实现

- 目标：承接用户故事“确认需要比对的数据，展示用户要比对的哪些数据”。
- 子任务：
  - 新增 `comparison-selected-summary.tsx`。
  - 展示 `Selected: n / 5`。
  - 展示已选记录摘要：`id`、`title`、`location`、`predictedPrice`、关键特征。
  - 实现单条 `Remove`。
  - 实现 `Clear Selection`。
  - 实现 `Select Data to Compare` / `Change Selection` 入口。
  - 当已选记录因删除或刷新失效时自动清理，并展示 warning。
- 产出：
  - 页面级已选摘要区。
- 验收标准：
  - 用户能明确看到当前要比对哪些记录，并可调整选择。

## 3.4 T3 - 选择弹窗基础结构

- 目标：搭建弹窗骨架，支持临时选择和确认。
- 子任务：
  - 新增 `comparison-selection-dialog.tsx`。
  - 使用现有 Shadcn UI Dialog 或项目内弹窗模式。
  - 弹窗标题：`Select Data to Compare`。
  - 弹窗打开时带入页面已确认选择作为 `tempSelectedRecordIds`。
  - 实现候选记录列表和 checkbox 选择。
  - 实现底部 `Cancel` / `Confirm Selection`。
  - `Confirm Selection` 少于 2 条时禁用。
  - 确认后回写页面级 `selectedRecordIds` 并关闭弹窗。
  - 取消时不污染页面已确认选择。
- 产出：
  - 可打开、选择、确认、取消的选择弹窗。
- 验收标准：
  - 临时选择和已确认选择隔离正确，确认后页面摘要与结果区刷新。

## 3.5 T4 - 弹窗搜索筛选与候选表格

- 目标：承接用户故事“通过弹窗搜索筛选选择”。
- 子任务：
  - 新增或扩展 `lib/valuation/compare-filters.ts`。
  - 定义 `CompareFilterInput` 类型。
  - 实现筛选字段：
    - `keyword`
    - `location`
    - `minPrice` / `maxPrice`
    - `bedroomsMin` / `bedroomsMax`
    - `bathroomsMin` / `bathroomsMax`
    - `yearBuiltMin` / `yearBuiltMax`
    - `schoolRatingMin` / `schoolRatingMax`
  - 实现区间校验：`min <= max`。
  - 实现 `Search` 与 `Reset`。
  - 候选表格展示核心列：Compare、ID、Title、Location、Create Date、Key Features、Prediction Price。
  - 支持 no-result 状态。
  - 对无预测价格记录禁用选择并展示原因。
  - 达到 5 条上限后禁用未选 checkbox。
- 产出：
  - 可筛选、可选择、可处理无结果和禁用项的候选表格。
- 验收标准：
  - 用户可按条件找到目标记录；非法筛选不触发搜索并有错误提示。

## 3.6 T5 - 比对结果视图完善

- 目标：承接用户故事“展示比对结果视图”。
- 子任务：
  - `comparison-result-view.tsx` 根据选择状态渲染：
    - `empty`
    - `selection-empty`
    - `selection-invalid`
    - `ready`
  - 完善 `ComparisonRadarChart`：
    - 7 个特征维度归一化。
    - 图例展示所有系列。
    - `role="img"` 与 `aria-label`。
  - 完善 `ComparisonPriceChart`：
    - 预测价格横向条形图。
    - 金额格式化。
    - 保持用户选择顺序。
  - 完善 `comparison-data-table.tsx`：
    - 展示图表等价数据。
    - 数值列对齐。
    - 表头 `scope="col"` 与 caption。
- 产出：
  - 完整的 Compare Result View。
- 验收标准：
  - 选择 2~5 条有效记录后，雷达图、价格图、数据表同步展示且数据一致。

## 3.7 T6 - 与 Prediction / History 对比入口联动

- 目标：确保 Compare Tool 可复用其他页面加入的选择状态。
- 子任务：
  - 检查 `ValuationShell` 中 `selectedForComparison` 状态提升位置。
  - 确保 Prediction / History 行级 `Select for Compare` 可写入同一选择池。
  - 选择达到 5 条后，Prediction / History 中未选 checkbox 或操作入口需禁用或拦截。
  - 从其他页面切换到 Compare Tool 后，已选摘要和结果视图正确展示。
  - 删除记录后，从选择池移除对应 ID。
- 产出：
  - 跨子页面共享的对比选择状态。
- 验收标准：
  - 用户可从 Prediction / History 添加记录，再进入 Compare Tool 直接查看结果。

## 3.8 T7 - 数据层、类型与映射工具

- 目标：隔离 Compare Tool 数据处理逻辑，减少组件内复杂度。
- 子任务：
  - 在 `lib/valuation/types.ts` 中补充：
    - `CompareFilterInput`
    - `CompareSelection`
    - 必要的 `ComparisonSeries` 扩展字段（如 `location`）。
  - 在 `lib/valuation/services.ts` 中补充候选数据查询封装：
    - 首版复用 `getPredictions`。
    - 对 recordIds 去重并最多取 5 条。
  - 新增或扩展 `compare-mappers.ts`：
    - `PredictionRecord` -> `ComparisonSeries`。
    - 过滤不可比对记录。
  - 新增或扩展 `compare-filters.ts`：
    - 前端筛选。
    - 区间校验。
    - 排序辅助函数。
- 产出：
  - Compare Tool 专用数据处理层。
- 验收标准：
  - 组件不直接承载复杂筛选、映射和校验逻辑。

## 3.9 T8 - 视觉样式与响应式适配

- 目标：落地详细设计中的 Carbon 风格与断点行为。
- 子任务：
  - 补齐 Compare Tool 样式 token 或复用 valuation token。
  - 已选摘要卡、弹窗、筛选表单、候选表格、图表卡片保持 0 圆角 + 1px 边框。
  - `lg`：弹窗约 `960px`，筛选 3~4 列，图表两列。
  - `md`：弹窗 `calc(100vw - 48px)`，筛选 2 列。
  - `sm`：弹窗近似全屏，筛选单列，候选表格可横向滚动或卡片化，图表纵向堆叠。
  - 验证 375 / 768 / 1280 宽度。
- 产出：
  - 多端布局稳定的 Compare Tool。
- 验收标准：
  - 各断点无明显错位、遮挡、不可点击区域；表格和图表保持可读。

## 3.10 T9 - 可访问性与安全基线

- 目标：满足 WCAG 与前端安全基线。
- 子任务：
  - 页面区块使用 `section` + `aria-labelledby`。
  - 弹窗具备正确 dialog 语义、焦点进入、ESC 关闭、焦点返回。
  - 筛选字段 label 绑定完整。
  - 校验错误使用 `aria-invalid` 与 `aria-describedby`。
  - 候选表格 checkbox 具备明确 `aria-label`。
  - 排序表头使用 `aria-sort`。
  - loading 使用 `aria-busy` 或等价状态；error 使用 `role="alert"`。
  - 选择数量变化使用 `aria-live="polite"`。
  - 不在 URL 或日志中暴露敏感信息。
  - 不使用不可信 `dangerouslySetInnerHTML`。
- 产出：
  - A11y 与安全基线达标。
- 验收标准：
  - 键盘可完成打开弹窗、筛选、选择、确认、关闭和查看结果流程。

## 3.11 T10 - 测试与质量验证

- 目标：完成自测、自动化建议覆盖与交付检查。
- 子任务：
  - 运行 `npm run lint`。
  - 手工测试主流程：
    - 打开 Compare Tool。
    - 通过弹窗搜索筛选。
    - 选择 1 条不可确认。
    - 选择 2 条可确认并展示结果。
    - 选择 5 条后上限生效。
    - 移除、清空、重新选择。
  - 手工测试异常流程：
    - 无历史记录。
    - 搜索无结果。
    - 记录无预测价格。
    - 接口失败。
  - 手工测试响应式与键盘操作。
  - 补充 React Testing Library 用例建议：
    - 少于 2 条禁用确认。
    - 达到 5 条禁用未选项。
    - confirm 才回写页面选择。
    - 区间筛选校验。
  - 补充 Playwright 用例建议：
    - 从 Compare Tool 弹窗完成选择。
    - 从 History 添加选择后进入 Compare Tool。
- 产出：
  - 测试记录、lint 结果与交付说明。
- 验收标准：
  - lint 通过；关键手工测试通过或有明确例外说明。

## 4. 里程碑与执行顺序

1. M1：完成 T0（参数冻结）
2. M2：完成 T1 + T2（结构拆分与已选摘要）
3. M3：完成 T3 + T4（选择弹窗与搜索筛选）
4. M4：完成 T5 + T6（结果视图与跨页面联动）
5. M5：完成 T7 + T8（数据工具与响应式视觉）
6. M6：完成 T9 + T10（A11y/安全与测试交付）

## 5. 任务依赖关系

- T1 依赖 T0。
- T2 依赖 T1 的页面结构拆分。
- T3 依赖 T2 的选择入口与页面级选择状态。
- T4 依赖 T3 的弹窗骨架。
- T5 可与 T3/T4 部分并行，但最终依赖页面级 `selectedRecordIds`。
- T6 依赖 `ValuationShell` 中选择状态稳定。
- T7 可与 T3/T4/T5 并行推进，但需避免类型命名冲突。
- T8 依赖主要组件结构稳定。
- T9 依赖主要交互完成后统一验收。
- T10 依赖全部开发任务完成。

## 6. Definition of Done（DoD）

- 功能：
  - Compare Tool 可通过 `/valuation?tab=comparison` 访问。
  - 用户可通过弹窗搜索筛选并选择 2~5 条记录。
  - 确认后页面展示已选摘要、雷达图、价格图和数据表。
  - Prediction / History 加入的选择可在 Compare Tool 复用。
- 状态：
  - loading、empty、no-result、error、selection-invalid 均有明确反馈。
  - 无预测价格记录不能进入比对结果。
- 视觉：
  - 保持 Carbon 风格：0 圆角、1px 边框、IBM Blue 主操作色。
  - 375 / 768 / 1280 宽度无明显错位或不可操作区域。
- 工程：
  - 组件职责清晰，筛选、映射、校验逻辑不堆在页面组件中。
  - `npm run lint` 通过。
- 可访问性与安全：
  - 键盘可完成核心流程。
  - 弹窗、表单、表格、图表具备必要语义与状态提示。
  - 不在 URL/日志中暴露敏感数据。

## 7. 风险与应对

1. `Comparation Tool` 与 `Comparison Tool` 文案不一致风险。
   - 应对：当前 UI 兼容 `Comparation Tool`，代码内部命名使用 `Comparison`，待产品确认后统一。
2. 后端筛选能力不足风险。
   - 应对：首版复用 `/api/predictions`，后端不支持的筛选在前端补充；数据量变大后再增加专用候选接口。
3. 雷达图量纲差异导致误读风险。
   - 应对：图形使用归一化值，数据表和 tooltip 展示原始值。
4. 选择状态刷新丢失风险。
   - 应对：首版接受页面内状态；若后续需要分享，追加 `compareIds` 或保存对比方案能力。
5. 弹窗内表格在小屏可读性下降风险。
   - 应对：小屏采用横向滚动或卡片化候选列表，并固定底部操作栏。

## 8. 开发检查清单（执行时勾选）

- [ ] 已完成文案、数量限制、接口假设冻结（T0）。
- [ ] 已完成 Compare Tool 结果区无行为重构（T1）。
- [ ] 已完成已选摘要区（T2）。
- [ ] 已完成选择弹窗基础结构（T3）。
- [ ] 已完成弹窗搜索筛选与候选表格（T4）。
- [ ] 已完成比对结果视图完善（T5）。
- [ ] 已完成 Prediction / History 选择联动（T6）。
- [ ] 已完成 Compare Tool 数据层、类型与映射工具（T7）。
- [ ] 已完成视觉样式与响应式适配（T8）。
- [ ] 已完成可访问性与安全基线检查（T9）。
- [ ] 已完成 lint、自测与交付说明（T10）。
