# Compare Tool 详细设计（normalCR）

## 1. 文档目标

基于以下输入，输出 Compare Tool（当前 UI 文案兼容 `Comparation Tool`）可实施详细设计，作为前端开发、联调、测试与验收依据：

- 需求文档：`docs/spec/compare-tool/normalCR/requirements/compare-tool.md`
- Valuation 页面基线：`docs/spec/valuation-app/normalCR/detail-design/valuation-app-detail-design.md`
- 全局设计约束：`docs/global-info/deisgn.md`
- 全局技术约束：`docs/global-info/techo-design.md`
- 当前前端实现基线：
  - `app/components/valuation/comparison-page.tsx`
  - `app/components/valuation/comparison-radar-chart.tsx`
  - `app/components/valuation/comparison-price-chart.tsx`
  - `lib/valuation/types.ts`
  - `lib/valuation/services.ts`

## 2. 范围定义

### 2.1 本次范围（In Scope）

- Compare Tool 作为 Valuation 应用内的独立子页，路由为 `/valuation?tab=comparison`。
- 用户通过弹窗搜索、筛选并选择需要比对的数据。
- 用户确认已选择的比对数据，可查看、移除、清空选择。
- 用户查看比对结果视图：
  - 房屋特征雷达图
  - 房价对比图
  - 等价数据表格
- 支持从 Prediction / History 列表通过 `Select for Compare` 加入比对池。
- 支持基础状态：loading、empty、no-result、error、selection-invalid。
- 支持基础响应式适配（sm/md/lg）与 WCAG 基线。

### 2.2 非范围（Out of Scope）

- 真实后端模型训练、特征工程与模型解释能力。
- 复杂 BI 能力，如多维钻取、报表导出、自由图表配置。
- 跨用户共享对比方案、收藏对比方案。
- i18n 与多币种汇率换算。

## 3. 需求与设计基线

### 3.1 用户故事拆解

需求文档定义 3 条用户故事：

1. 用户选择需要比对的数据，通过弹窗搜索筛选选择。
2. 用户确认需要比对的数据，展示用户要比对的哪些数据。
3. 展示比对结果视图。

对应设计拆解：

- `Select`：打开选择弹窗，按关键词、位置、价格区间、特征范围筛选记录，勾选 2~5 条可比对记录。
- `Confirm`：弹窗内确认后回写页面选择区；页面持续展示已选记录摘要、数量、移除和清空入口。
- `Compare`：当有效记录数达到 2 条时渲染雷达图、价格对比图和数据表；少于 2 条时展示引导状态。

### 3.2 现有系统约束

- 技术栈：Next.js App Router + React + Tailwind CSS + Shadcn UI。
- 视觉基调：IBM Carbon 倾向，保持 0 圆角、1px 描边、白/浅灰底、IBM Blue `#0f62fe` 作为主操作色。
- Valuation 当前路由策略：
  - 主入口：`/valuation`
  - Compare Tool：`/valuation?tab=comparison`
  - 兼容入口：`/valuation?view=compare`、`/valuation?mode=analysis`
- 当前数据结构以 `PredictionRecord` 为源数据，只有 `predictedPrice !== null` 的记录可进入结果图表。

## 4. 信息架构与路由设计

```text
Valuation App (/valuation)
└─ Compare Tool (/valuation?tab=comparison)
   ├─ Page Header
   ├─ Selected Summary Panel
   │  ├─ Selected Count
   │  ├─ Selected Record Chips / Cards
   │  ├─ Add / Change Selection
   │  └─ Clear Selection
   ├─ Select Compare Data Dialog
   │  ├─ Search & Filter Form
   │  ├─ Candidate Result Table
   │  ├─ Temporary Selection Panel
   │  └─ Cancel / Confirm
   └─ Compare Result View
      ├─ Feature Radar Chart
      ├─ Prediction Price Chart
      └─ Comparison Data Table
```

### 4.1 路由规则

- Compare Tool 使用既有路由：`/valuation?tab=comparison`。
- 从 Portal 中 `Property Compare` 或 `House Price Analysis Application` 进入时统一归一化到 `tab=comparison`。
- 选择数据首版不写入 URL，避免 URL 过长；如后续需要可分享对比结果，可追加 `compareIds=PD-001,PD-002`。

### 4.2 导航规则

- 左侧导航项文案保持与现有实现兼容：`Comparation Tool`。
- 设计文档与代码命名建议使用 `Compare Tool` / `Comparison`，对外展示文案可由产品统一修订。
- 当前页左导航需设置 `aria-current="page"`。

## 5. 页面结构详细设计

## 5.1 Page Header

- 标题：`Comparation Tool`（兼容现有 UI 文案；建议后续修订为 `Comparison Tool`）。
- 副文案：`Search and select 2 to 5 prediction records to compare property features and predicted prices.`
- 主操作按钮：`Select Data to Compare`。

交互：

- 点击主按钮打开选择弹窗。
- 当已有选择时，按钮文案可为 `Change Selection`。
- 页面标题区不承载筛选条件，筛选统一收敛在弹窗内。

## 5.2 Selected Summary Panel

用途：承接用户故事 2，展示用户确认后要比对的数据。

内容：

- 已选数量：`Selected: n / 5`。
- 已选记录摘要：
  - `id`
  - `title`
  - `location`
  - `predictedPrice`
  - 关键特征摘要（建议展示 `squareFootage`、`bedrooms`、`schoolRating`）
- 操作：
  - `Remove`：移除单条记录。
  - `Clear Selection`：清空全部选择。
  - `Select Data to Compare` / `Change Selection`：打开弹窗。

规则：

- 最少选择 2 条记录后可展示比对结果。
- 最多选择 5 条记录；达到 5 条后未选候选项禁用。
- 仅允许 `predictedPrice !== null` 的记录进入结果视图。
- 如果已选记录被删除或接口刷新后不存在，需要自动从选择池移除并展示轻提示。

## 5.3 Select Compare Data Dialog

用途：承接用户故事 1，通过弹窗搜索筛选选择比对数据。

### 5.3.1 弹窗结构

```text
Dialog
├─ Header
│  ├─ Title: Select Data to Compare
│  └─ Close Button
├─ Filter Form
│  ├─ Keyword
│  ├─ Location
│  ├─ Price Range
│  ├─ Bedrooms Range
│  ├─ Bathrooms Range
│  ├─ Year Built Range
│  └─ Search / Reset
├─ Candidate Table
│  ├─ Compare Checkbox
│  ├─ ID
│  ├─ Title
│  ├─ Location
│  ├─ Create Date
│  ├─ Key Features
│  └─ Prediction Price
├─ Temporary Selection Bar
│  ├─ Selected n / 5
│  └─ selected chips
└─ Footer
   ├─ Cancel
   └─ Confirm Selection
```

### 5.3.2 筛选字段

- `keyword`：按 `id`、`title` 模糊搜索。
- `location`：按位置模糊搜索或下拉选择。
- `minPrice` / `maxPrice`：价格区间。
- `bedroomsMin` / `bedroomsMax`：卧室数量区间。
- `bathroomsMin` / `bathroomsMax`：卫生间数量区间。
- `yearBuiltMin` / `yearBuiltMax`：建造年份区间。
- `schoolRatingMin` / `schoolRatingMax`：学校评分区间。

校验：

- 区间字段必须满足 `min <= max`。
- 数值字段非法时不发起搜索，字段下方展示 inline error。
- 空筛选表示查询全部可比对记录。

### 5.3.3 候选表格

- 表格默认按 `createdAt desc` 排序。
- 支持本页排序字段：
  - `createdAt`
  - `predictedPrice`
  - `squareFootage`
  - `yearBuilt`
  - `schoolRating`
- 行禁用条件：
  - 记录没有预测价格。
  - 已选数量达到 5，且当前行未选中。
- 行辅助提示：
  - 无预测价格：`Run prediction before comparing this record.`
  - 已达到上限：`You can compare up to five records.`

### 5.3.4 确认规则

- `Confirm Selection` 在临时选择数 `< 2` 时禁用。
- 确认后：
  - 将临时选择写入页面级 `selectedRecordIds`。
  - 关闭弹窗。
  - 页面结果区刷新。
- `Cancel` / 关闭按钮：
  - 临时选择与页面已确认选择不一致时，展示二次确认。
  - 无变更时直接关闭。

## 5.4 Compare Result View

用途：承接用户故事 3，展示比对结果视图。

### 5.4.1 空状态与有效性状态

- `empty`：无历史预测数据。
  - 文案：`No prediction records are available. Create a prediction first.`
  - 操作：`Create Prediction`
- `selection-empty`：有数据但未选择。
  - 文案：`Select 2 to 5 records to start comparison.`
  - 操作：`Select Data to Compare`
- `selection-invalid`：只选择 1 条。
  - 文案：`Please select at least two records to generate comparison charts.`
- `ready`：选择数 2~5 且记录可用，展示图表与数据表。

### 5.4.2 Feature Radar Chart

- 图表标题：`Feature Radar Comparison`。
- 维度：
  - `squareFootage`
  - `bedrooms`
  - `bathrooms`
  - `yearBuilt`
  - `lotSize`
  - `distanceToCityCenter`
  - `schoolRating`
- 归一化规则：
  - 每个维度按当前选择样本的最大值归一化到 `0~1`。
  - 如果维度最大值小于或等于 0，使用 1 作为保护值。
  - tooltip 与数据表展示原始值。
- 颜色：
  - 最多 5 条系列，对应 5 个稳定颜色。
  - 色彩不能作为唯一信息来源，必须配合图例名称。

### 5.4.3 Prediction Price Chart

- 图表标题：`Prediction Price Comparison`。
- 首版采用横向条形图，Y 轴为记录标题，X 轴为预测价格。
- 金额格式：
  - 默认 `USD`
  - 无小数位
  - 使用 `Intl.NumberFormat`
- 排序：
  - 默认保持用户选择顺序。
  - 可扩展 `Sort by selected order | price desc | price asc`。

### 5.4.4 Comparison Data Table

用途：提供图表的等价数据表达，满足可访问性与精确比对需要。

列：

- `Title`
- `Location`
- `Square Footage`
- `Bedrooms`
- `Bathrooms`
- `Year Built`
- `Lot Size`
- `Distance to City Center`
- `School Rating`
- `Predicted Price`

表格要求：

- 数值列右对齐或使用 tabular number，便于扫描。
- 表头使用 `scope="col"`。
- 提供 `caption` 或 `aria-label`。
- 小屏允许横向滚动，不压缩到不可读。

## 6. 交互流程设计

### 6.1 主流程

```text
进入 Compare Tool
  -> 点击 Select Data to Compare
  -> 弹窗加载候选预测记录
  -> 用户输入筛选条件并 Search
  -> 勾选 2~5 条记录
  -> Confirm Selection
  -> 页面展示已选摘要
  -> 渲染雷达图、价格对比图、数据表
```

### 6.2 从列表加入对比流程

```text
Prediction / History
  -> 勾选 Select for Compare
  -> 选择写入页面级 selectedRecordIds
  -> 切换到 Comparation Tool
  -> 展示已选摘要与比对结果
```

### 6.3 修改选择流程

```text
已存在选择
  -> 点击 Change Selection
  -> 弹窗带入已确认选择作为临时选择
  -> 增删记录或重新筛选
  -> Confirm Selection
  -> 覆盖页面选择并刷新结果
```

## 7. 状态机设计

### 7.1 页面状态

```text
idle
  -> loadingRecords
  -> ready | empty | error
```

字段建议：

```ts
type ComparePageState = {
  records: PredictionRecord[];
  selectedRecordIds: string[];
  isLoading: boolean;
  error: string | null;
};
```

### 7.2 弹窗状态

```text
closed
  -> opening
  -> loadingCandidates
  -> ready
  -> filtering
  -> confirmable | invalidSelection
  -> confirming
  -> closed
```

字段建议：

```ts
type CompareSelectionDialogState = {
  open: boolean;
  filters: CompareFilterInput;
  candidates: PredictionRecord[];
  tempSelectedRecordIds: string[];
  isSearching: boolean;
  fieldErrors: Record<string, string>;
  error: string | null;
};
```

### 7.3 错误处理

- 候选数据加载失败：弹窗内展示 error block + `Retry`。
- 搜索失败：保留上一次成功结果，展示顶部 inline alert。
- 选择不足：禁用确认按钮，同时在底部展示说明。
- 超过上限：禁用未选 checkbox，并在选择计数处展示说明。
- 已选数据失效：页面 summary 中移除失效项并展示 warning。

## 8. 数据模型与接口契约

### 8.1 TypeScript 类型建议

```ts
export type CompareFilterInput = {
  keyword?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  bedroomsMin?: number;
  bedroomsMax?: number;
  bathroomsMin?: number;
  bathroomsMax?: number;
  yearBuiltMin?: number;
  yearBuiltMax?: number;
  schoolRatingMin?: number;
  schoolRatingMax?: number;
  page?: number;
  size?: number;
  sortBy?: "createdAt" | "predictedPrice" | "squareFootage" | "yearBuilt" | "schoolRating";
  sortDirection?: "asc" | "desc";
};

export type CompareSelection = {
  recordIds: string[];
};

export type ComparisonSeries = {
  recordId: string;
  title: string;
  location?: string;
  predictedPrice: number;
  features: ValuationFeatureInput;
};
```

### 8.2 前端服务设计

首版可复用现有预测历史接口：

- `GET /api/predictions`
  - 用途：查询可选择记录。
  - 查询参数：分页、关键词、位置、价格区间。
  - 前端过滤补充：后端暂不支持的特征区间可在客户端过滤。
- `GET /api/predictions/:id`
  - 用途：进入页面时按 ID 回补分享态或已选记录详情。

如后端后续提供专用接口，建议契约：

- `GET /api/valuation/compare/candidates`
  - 请求：`CompareFilterInput`
  - 响应：`{ items: PredictionRecord[]; total: number; page: number; size: number }`
- `POST /api/valuation/compare/series`
  - 请求：`{ recordIds: string[] }`
  - 响应：`ComparisonSeries[]`

错误结构建议：

```json
{
  "error": {
    "code": "COMPARE_CANDIDATE_FETCH_FAILED",
    "message": "Failed to load records for comparison"
  }
}
```

## 9. 前端实现设计

### 9.1 文件规划

```text
app/components/valuation/
├─ comparison-page.tsx
├─ comparison-selection-dialog.tsx
├─ comparison-selected-summary.tsx
├─ comparison-result-view.tsx
├─ comparison-radar-chart.tsx
├─ comparison-price-chart.tsx
└─ comparison-data-table.tsx

lib/valuation/
├─ types.ts
├─ services.ts
├─ compare-filters.ts
└─ compare-mappers.ts
```

### 9.2 组件职责

- `comparison-page.tsx`
  - 管理页面级选择状态。
  - 组装选择摘要、选择弹窗和结果视图。
- `comparison-selection-dialog.tsx`
  - 管理弹窗内筛选、分页、临时选择和确认。
  - 不直接修改页面已确认选择，只有确认时回调。
- `comparison-selected-summary.tsx`
  - 展示已选记录摘要。
  - 提供单条移除、清空和重新选择入口。
- `comparison-result-view.tsx`
  - 根据选择有效性渲染 empty/invalid/ready。
  - 组装图表与数据表。
- `comparison-radar-chart.tsx`
  - 负责特征归一化和 SVG 雷达图渲染。
- `comparison-price-chart.tsx`
  - 负责价格条形图与金额格式化。
- `comparison-data-table.tsx`
  - 提供图表等价数据表。

### 9.3 状态提升规则

- `selectedRecordIds` 保持在 `ValuationShell` 或 `ComparisonPage` 顶层，便于 Prediction / History 与 Compare Tool 共享。
- 弹窗内部使用 `tempSelectedRecordIds`，避免用户取消时污染已确认选择。
- `records` 刷新后需要清理不存在或不可比对的 ID。

### 9.4 与现有实现的演进关系

当前已有：

- `ComparisonPage`：页面结构、选择数量、候选 checkbox、图表区域。
- `ComparisonRadarChart`：SVG 雷达图。
- `ComparisonPriceChart`：价格条形图。
- `ComparisonSeries`：图表数据类型。

本次设计建议在当前实现上增量演进：

1. 将当前页面内候选 checkbox 提取为 `comparison-selection-dialog.tsx`。
2. 新增 `comparison-selected-summary.tsx` 承接已确认选择展示。
3. 将图表与数据表提取为 `comparison-result-view.tsx`。
4. 扩展筛选字段与校验逻辑。
5. 补齐状态、可访问性和测试。

## 10. 视觉与样式设计

### 10.1 Token 建议

```css
:root {
  --compare-bg: #fafbfd;
  --compare-surface: #ffffff;
  --compare-surface-muted: #f4f4f4;
  --compare-border: #e2e2e2;
  --compare-border-strong: #c9cbda;
  --compare-text: #161616;
  --compare-text-muted: #525252;
  --compare-primary: #0f62fe;
  --compare-danger: #da1e28;
  --compare-focus: #0f62fe;

  --compare-radius: 0px;
  --compare-control-height: 40px;
  --compare-dialog-width: 960px;
}
```

### 10.2 样式原则

- 弹窗、按钮、输入框、卡片保持 `0` 圆角。
- 主要操作按钮使用 IBM Blue；次要操作使用白底蓝边或 ghost button。
- 表格和卡片层级通过 `1px` 边框与浅灰背景表达，不使用重阴影。
- 数值展示使用稳定对齐，避免价格和特征值跳动影响扫描。

## 11. 可访问性设计

- 页面使用 `section` + `aria-labelledby` 关联标题。
- 弹窗：
  - 使用语义 dialog。
  - 打开后焦点进入标题或第一个筛选输入。
  - ESC 可关闭。
  - 关闭后焦点返回触发按钮。
  - 有未确认变更时关闭前二次确认。
- 筛选表单：
  - `label` 与输入控件显式绑定。
  - 校验错误使用 `aria-invalid` 与 `aria-describedby`。
- 候选表格：
  - checkbox 提供明确 `aria-label`，如 `Select London House Prediction for comparison`。
  - 排序表头使用 `aria-sort`。
- 图表：
  - SVG 使用 `role="img"` 和 `aria-label`。
  - 必须提供等价数据表格。
- 状态反馈：
  - loading 可用 `aria-busy`。
  - error 使用 `role="alert"`。
  - 选择数量变化可用 `aria-live="polite"`。

## 12. 响应式设计

### 12.1 断点

- `sm`: `<768px`
- `md`: `768px~1023px`
- `lg`: `>=1024px`

### 12.2 断点行为

- `lg`：
  - 弹窗宽度约 `960px`。
  - 筛选表单 3~4 列。
  - 雷达图与价格图两列展示，数据表独占一行。
- `md`：
  - 弹窗宽度为视口 `calc(100vw - 48px)`。
  - 筛选表单 2 列。
  - 图表可两列或纵向堆叠，按可用宽度决定。
- `sm`：
  - 弹窗近似全屏，保留顶部标题和底部固定操作栏。
  - 筛选表单单列。
  - 候选表格可降级为卡片列表。
  - 图表纵向堆叠，数据表横向滚动。

## 13. 安全与鲁棒性设计

- 前端只做交互校验，后端仍需校验 recordIds 是否属于当前用户且可访问。
- 不在 URL 中暴露敏感信息；如后续支持分享，只传业务 ID，不传价格计算中间值。
- API 错误文案不暴露内部栈、SQL、模型服务细节。
- 对所有用户输入依赖 React 默认转义，不使用不可信 `dangerouslySetInnerHTML`。
- 对重复 ID 去重，最多取前 5 条。
- 对空数组、缺失预测价格、数据刷新后记录不存在做显式处理。

## 14. 测试设计

### 14.1 手工测试

1. 进入 `/valuation?tab=comparison`，页面标题与选择入口可见。
2. 点击 `Select Data to Compare`，弹窗打开且焦点进入弹窗。
3. 输入关键词搜索，候选列表按条件更新。
4. 选择 1 条记录时无法确认，并显示至少选择 2 条的说明。
5. 选择 2 条记录后确认，页面展示已选摘要、雷达图、价格图和数据表。
6. 选择达到 5 条后，其他未选记录 checkbox 禁用。
7. 移除 1 条记录后，图表和数据表同步更新。
8. 清空选择后，结果区回到引导状态。
9. 对无预测价格记录，候选项不可选择并提示原因。
10. 在 375 / 768 / 1280 宽度下验证弹窗、图表和表格无遮挡。
11. 全程键盘操作：打开弹窗、搜索、勾选、确认、关闭均可完成。

### 14.2 自动化建议

- React Testing Library：
  - `comparison-selection-dialog` 筛选字段校验。
  - 少于 2 条禁用确认。
  - 达到 5 条禁用未选 checkbox。
  - confirm 只在确认时回写页面选择。
- Playwright：
  - 从 Compare Tool 打开弹窗并完成选择。
  - 从 History 勾选记录后切换到 Compare Tool。
  - 小屏下弹窗操作与结果视图可用。
- 可访问性：
  - 检查 dialog role、label、aria-invalid、aria-sort。
  - 检查图表存在等价数据表。

## 15. 验收标准

- 用户可在 Compare Tool 中通过弹窗搜索、筛选并选择 2~5 条预测记录。
- 用户确认选择后，页面展示已选记录摘要，并可移除单条或清空全部。
- 有效选择数达到 2 条后，页面展示特征雷达图、预测价格对比图和等价数据表。
- 少于 2 条、无数据、搜索无结果、接口失败等状态均有明确反馈。
- 无预测价格的记录不能进入比对结果。
- Compare Tool 可复用 Prediction / History 已加入的选择状态。
- sm/md/lg 断点下无明显错位、遮挡和不可操作区域。
- 键盘可完成核心流程，错误和状态变化可被辅助技术感知。
- `npm run lint` 通过。

## 16. 实施顺序建议

1. 提取 `comparison-selected-summary.tsx` 与 `comparison-result-view.tsx`，保持现有页面行为不变。
2. 新增 `comparison-selection-dialog.tsx`，将当前页面内选择列表迁移到弹窗。
3. 扩展筛选字段、校验和 no-result 状态。
4. 补齐选择确认、取消二次确认、达到上限禁用等交互。
5. 优化雷达图、价格图与数据表的可访问性。
6. 完成响应式样式与测试。

## 17. 风险与待确认项

1. 对外文案存在 `Comparation Tool` 与 `Comparison Tool` 不一致。
   - 建议：代码内部使用 `Comparison`，当前 UI 暂兼容 `Comparation Tool`，待产品确认后统一修订。
2. 后端筛选能力可能不足。
   - 建议：首版复用 `/api/predictions`，后端不支持的筛选在前端补充；数据量增大后补专用候选接口。
3. 雷达图维度量纲差异大。
   - 建议：图形使用归一化值，tooltip 和数据表展示原始值。
4. 选择状态首版不写 URL，刷新后会丢失。
   - 建议：若产品需要可分享结果，再增加 `compareIds` 查询参数或保存对比方案能力。
