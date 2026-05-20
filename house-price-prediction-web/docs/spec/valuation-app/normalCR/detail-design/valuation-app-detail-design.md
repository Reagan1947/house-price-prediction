# Valuation App 页面详细设计（normalCR）

## 1. 文档目标

基于以下输入，输出 House-Price Valuation 应用可实施详细设计，作为前端开发、联调与验收依据：

- 需求文档：`docs/spec/valuation-app/normalCR/requiremenmts/valuation-app-requirements.md`
- 全局设计约束：`docs/global-info/deisgn.md`
- 全局技术约束：`docs/global-info/techo-design.md`
- Portal 基线设计：`docs/spec/app-portal/normalCR/detail-design/app-portal-detail-design.md`
- Figma（预测列表页）：<https://www.figma.com/design/M2IiAGmNgLFwWveEkq3v5C/Untitled?node-id=16-15&m=dev>
- Figma（新建预测表单）：<https://www.figma.com/design/M2IiAGmNgLFwWveEkq3v5C/Untitled?node-id=53-2745&m=dev>

## 2. 范围定义

### 2.1 本次范围（In Scope）

- Valuation 应用从 Portal 的两个入口进入：
  - `/portal` 首页 `Shortcut`
  - `/portal/applications` 应用列表
- Valuation 应用主页面（Prediction 列表与筛选）。
- 新建预测弹窗（Create New House Price Prediction）。
- 历史预测记录管理（History）。
- 对比工具（Comparation Tool）能力：
  - 多房屋特征雷达图
  - 房价对比图
- 基础响应式适配（sm/md/lg）与 WCAG 基线。

### 2.2 非范围（Out of Scope）

- 模型训练、模型版本管理、特征工程平台能力。
- 真实后端模型服务部署与 MLOps。
- 复杂 BI 报表、导出 PDF 模板引擎。
- 多租户主题切换与 i18n。

## 3. 需求与设计基线

### 3.1 需求要点

- 核心功能：用户填写房屋特征后预测房价，并管理历史预测结果。
- 预测特征字段：
  - `square_footage`
  - `bedrooms`
  - `bathrooms`
  - `year_built`
  - `lot_size`
  - `distance_to_city_center`
  - `school_rating`
- 对比工具：
  - 房屋间特征雷达图
  - 房价对比可视化图

### 3.2 Figma 结构映射

#### A. 预测页面（`16:15`）

- 页面采用与 Portal 一致的顶栏与左导航风格。
- 左导航含：`Home Page`、`Prediction`、`History`、`Comparation Tool`。
- 主区结构：
  - 页面标题与说明文案
  - 筛选区（多字段 + Search + Advanced）
  - `Create Prediction` 按钮
  - 结果表格（含特征列与 `Prediction Price`）

#### B. 新建预测表单（`53:2745`）

- 右上角关闭按钮。
- 顶部标题：`Create New House Price Prediction`。
- 标题输入框（Title）。
- `Basic Information` 两列网格输入区域（7 个维度字段）。
- `Pridction House Price`（只读结果区）+ `Pridict House Price` 按钮。
- 底部 `Cancel` / `Save` 操作栏。

### 3.3 全局约束吸收

- 技术栈：Next.js App Router + React + Tailwind CSS + Shadcn UI。
- 视觉基调：IBM Carbon 倾向（0 圆角、1px 边框、主色蓝 `#0f62fe`）。
- 可访问性：键盘可达、焦点可见、语义结构与错误可感知。

## 4. 信息架构与路由设计

```text
Portal Home (/portal)
  -> Shortcut card click
Portal Applications (/portal/applications)
  -> Open app
    -> Valuation App (/valuation)
       ├─ Prediction (/valuation or /valuation?tab=prediction)
       ├─ History (/valuation?tab=history)
       └─ Comparison Tool (/valuation?tab=comparison)
```

### 4.1 路由约束

- 主入口路由：`/valuation`（保持与现有 Portal mock 数据兼容）。
- 子页面通过查询参数承载：`tab=prediction|history|comparison`。
- 与已有入口参数兼容：
  - `/valuation?mode=analysis` -> 归一化到 `tab=comparison`
  - `/valuation?view=compare` -> `tab=comparison`
  - `/valuation?predictionId=PD-xxx` -> 打开对应历史记录详情/编辑态

### 4.2 Portal 入口对接规则

- `Shortcut` 中的 `House Price Valuation Application` 点击进入 `/valuation`。
- `Applications` 中的 `House Price Valuation Application` 点击进入 `/valuation`。
- 在 Portal 保留 `House Price Analysis Application`，统一映射到 `/valuation?tab=comparison`。

## 5. 页面结构详细设计

## 5.1 Valuation Shell

- 顶栏：与 Portal 统一（品牌、用户菜单）。
- 左侧导航：
  - `Home Page`（返回 `/portal`）
  - `Prediction`（当前主流程）
  - `History`
  - `Comparation Tool`
- 主内容：根据 `tab` 渲染对应功能区域。

交互要求：

- 左导航项支持键盘切换与 `aria-current="page"`。
- 切换 `tab` 时保留筛选状态（URL 同步）。

## 5.2 Prediction 页面

### 5.2.1 页面头

- 标题：`Prediction`。
- 副文案：说明筛选与管理用途（按产品文案最终确认）。

### 5.2.2 筛选区

- 基础筛选字段（首版建议）：
  - `Title`
  - `Location`
  - `Create Date`
  - `square_footage`
  - `bedrooms`
  - `year_built`
  - `lot_size`
  - `distance_to_city_center`
  - `school_rating`
- 操作：
  - `Search`
  - `Reset`
  - `Advanced`（展开高级筛选）
  - `Create Prediction`（打开新建弹窗）

### 5.2.3 列表表格

- 列建议：
  - `ID`
  - `Title`
  - `Location`
  - `Create Date`
  - `Square Footage`
  - `Bedrooms`
  - `Bathrooms`
  - `Year Built`
  - `Lot Size`
  - `Distance to City Center`
  - `School Rating`
  - `Prediction Price`
  - `Actions`
- 行级操作：
  - `View`
  - `Edit`
  - `Delete`
  - `Select for Compare`（加入对比池）

状态：

- loading：骨架行
- empty：空状态提示 + `Create Prediction`
- error：错误提示 + Retry

## 5.3 Create Prediction 弹窗

### 5.3.1 弹窗信息架构

- 标题区：标题 + 关闭按钮。
- 基础输入区：
  - `Title`（必填）
  - 7 个预测特征字段（均必填）
- 结果区：`Prediction House Price`（只读）。
- 操作区：`Cancel`、`Save`。

### 5.3.2 字段校验

- `square_footage`: 正数，建议范围 `100~20000`
- `bedrooms`: 整数，建议范围 `0~20`
- `bathrooms`: 非负数，支持 `0.5` 步长
- `year_built`: 四位年份，建议 `1800~当前年份`
- `lot_size`: 正数
- `distance_to_city_center`: 非负数
- `school_rating`: 建议范围 `0~10`

### 5.3.3 交互规则

- 点击 `Pridict House Price` 触发预测接口，回填结果区。
- 未成功预测前，`Save` 保持禁用。
- `Save` 提交后回写列表并关闭弹窗。
- `Cancel` 或关闭图标在表单脏数据时弹确认框。

## 5.4 History 页面

- 展示用户历史预测记录。
- 支持按时间、标题、位置筛选。
- 支持操作：`View`、`Reuse`（回填到新建表单）、`Delete`、`Select for Compare`。
- 支持分页与排序（默认按 `createdAt desc`）。

## 5.5 Comparison Tool 页面

### 5.5.1 选择区

- 从历史记录中选择 2~5 个房屋样本。
- 顶部展示已选数量及清空入口。

### 5.5.2 可视化区

- 图表 1：特征雷达图
  - 维度：7 个预测特征
  - 每个样本一条多边形
- 图表 2：房价对比图
  - 建议柱状图（样本标题为 X，预测价格为 Y）

### 5.5.3 交互

- 支持悬停 tooltip 查看具体值。
- 支持图例开关单个样本显示/隐藏。
- 空状态引导用户从 History 选择样本。

## 6. 视觉与样式详细设计

### 6.1 Token 建议（在 Portal Token 基础上扩展）

```css
:root {
  --valuation-bg: #fafbfd;
  --valuation-surface: #ffffff;
  --valuation-border: #e2e2e2;
  --valuation-border-strong: #c9cbda;
  --valuation-text: #161616;
  --valuation-text-muted: #757588;
  --valuation-primary: #0f62fe;
  --valuation-primary-ink: #0c479d;
  --valuation-focus: #0f62fe;
  --valuation-danger: #da1e28;

  --valuation-header-height: 62px;
  --valuation-sidenav-width: 200px;
  --valuation-filter-height: 38px;
  --valuation-control-height: 40px;
}
```

### 6.2 样式原则

- 所有控件与卡片保持 `0` 圆角。
- 表格使用 1px 分隔线表达层级，不用重阴影。
- 主交互按钮统一蓝底白字。
- 筛选区与内容区保持同一网格对齐。

## 7. 数据模型与接口契约（前端视角）

### 7.1 TypeScript 类型建议

```ts
export type ValuationFeatureInput = {
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  lotSize: number;
  distanceToCityCenter: number;
  schoolRating: number;
};

export type PredictionRecord = {
  id: string;
  title: string;
  location?: string;
  features: ValuationFeatureInput;
  predictedPrice: number;
  currency: "USD" | "CNY";
  createdAt: string;
  updatedAt: string;
};

export type ComparisonSeries = {
  recordId: string;
  title: string;
  features: ValuationFeatureInput;
  predictedPrice: number;
};
```

### 7.2 API 契约建议

- `POST /api/valuation/predict`
  - 请求：`ValuationFeatureInput`
  - 响应：`{ predictedPrice: number; currency: string; modelVersion: string }`
- `GET /api/valuation/predictions`
  - 查询：分页 + 筛选 + 排序
  - 响应：`{ items: PredictionRecord[]; total: number }`
- `POST /api/valuation/predictions`
  - 请求：`title + features + predictedPrice`
  - 响应：`PredictionRecord`
- `DELETE /api/valuation/predictions/:id`
- `POST /api/valuation/comparisons`
  - 请求：`recordIds: string[]`
  - 响应：`ComparisonSeries[]`

## 8. 状态机与错误处理

### 8.1 页面级状态

- `idle` -> `loading` -> `ready` | `error`

### 8.2 弹窗状态

- `closed`
- `editing`
- `predicting`
- `predicted`
- `saving`
- `saveError`

### 8.3 错误反馈

- 表单字段错误：字段下方 inline message。
- 预测失败：结果区上方 alert + Retry。
- 列表加载失败：区块级错误 + Retry。

## 9. 可访问性与安全设计

- 语义：`main/nav/section/table/dialog/form`。
- 弹窗：
  - 打开后焦点陷阱（focus trap）
  - ESC 可关闭
  - 关闭后焦点返回触发按钮
- 表单错误：`aria-invalid` + `aria-describedby`。
- 图表：
  - 提供等价数据表格，保证非视觉可访问。
- 安全：
  - 前端仅做格式校验，后端强校验。
  - 不在 URL/日志暴露敏感字段。

## 10. 响应式设计

### 10.1 断点

- `sm`: `<768px`
- `md`: `768~1023px`
- `lg`: `>=1024px`

### 10.2 断点行为

- `lg`：侧栏常驻，表格横向完整展示。
- `md`：筛选区换行为 2~3 列，表格可横向滚动。
- `sm`：
  - 左导航折叠为顶部切换菜单。
  - 筛选区单列。
  - 列表降级为卡片列表（每条记录显示关键字段）。
  - Comparison 图表支持纵向堆叠。

## 11. 前端实现设计（建议文件规划）

```text
app/
├─ valuation/
│  ├─ page.tsx
│  └─ loading.tsx
├─ components/valuation/
│  ├─ valuation-shell.tsx
│  ├─ valuation-sidenav.tsx
│  ├─ prediction-page.tsx
│  ├─ prediction-filter-bar.tsx
│  ├─ prediction-table.tsx
│  ├─ create-prediction-dialog.tsx
│  ├─ history-page.tsx
│  ├─ comparison-page.tsx
│  ├─ comparison-radar-chart.tsx
│  └─ comparison-price-chart.tsx
└─ lib/valuation/
   ├─ types.ts
   ├─ services.ts
   ├─ validators.ts
   └─ mappers.ts
```

实现要点：

- 复用现有 Portal 风格变量，避免重复定义同义 token。
- `tab` 与筛选参数全部 URL 化，保证可分享与可回放。
- 将 mock 数据与真实 API 适配分层，避免组件直接依赖后端返回格式。

## 12. 验收标准

- 可从 `/portal` 的 `Shortcut` 进入 Valuation。
- 可从 `/portal/applications` 的应用卡片进入 Valuation。
- Prediction 页面支持创建、查询、查看、编辑、删除预测记录。
- Create Prediction 弹窗可完成预测并保存记录。
- Comparison Tool 可输出雷达图与价格对比图。
- `sm/md/lg` 下布局无明显错位，键盘可完成核心流程。

## 13. 实施顺序建议

1. 完成路由与入口对接（Portal -> `/valuation`）。
2. 落地 Prediction 列表与筛选。
3. 落地 Create Prediction 弹窗与预测流程。
4. 落地 History 页面。
5. 落地 Comparison Tool（选择器 + 两类图表）。
6. 完成可访问性、响应式、错误处理与测试。

## 14. 风险与待确认项

1. Figma 中部分文案和字段拼写存在错误（如 `Beedrooms`、`Pridict`、`Comparation`）。
   - 建议：UI 对外文案按规范英文修订，字段键名按需求文档标准化。
2. Prediction 列表字段较多，移动端完整表格可读性有限。
   - 建议：移动端采用卡片降级展示。
3. 对比图数据需要统一量纲。
   - 建议：雷达图使用标准化值（0~1），tooltip 展示原始值。
4. 当前仓库尚无 valuation 专用 API 设计文档。
   - 建议：后续在 `docs/spec/valuation-app/normalCR/api-design/` 补齐接口文档。
