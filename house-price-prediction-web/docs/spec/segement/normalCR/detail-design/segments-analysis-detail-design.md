# Segments 分析详细设计（normalCR）

## 1. 文档目标

基于以下输入，输出 Segments 分析（Segment Analysis）可实施详细设计，作为前端开发、后端开发、联调、测试与验收依据：

- 需求文档：`docs/spec/segement/normalCR/requirements/segments-analysis.md`
- API 设计：`docs/spec/segement/normalCR/api-design/segments-api-design.md`
- 全局设计约束：`docs/global-info/deisgn.md`
- 全局技术约束：`docs/global-info/techo-design.md`
- Dashboard 区间筛选语义：`docs/spec/dashboard/normalCR/api-design/dashboard-api-design.md`（若存在）
- 当前前端实现基线：
  - `app/analysis/page.tsx`
  - `app/components/analysis/analysis-shell.tsx`
  - `app/components/analysis/segments/segments-tab.tsx`
  - `lib/analysis/types.ts`
  - `lib/analysis/aggregators.ts`
  - `lib/analysis/services.ts`
  - `lib/analysis/filters.ts`
  - `lib/analysis/dashboard-api.ts`（筛选字段映射参考）

## 2. 范围定义

### 2.1 本次范围（In Scope）

- Market Analysis 应用内 **Segments** 子页（`/analysis?tab=segments`）。
- 用户单选分组维度，对当前筛选后的房屋记录按维度 `GROUP BY` 聚合。
- 五种分组维度：`bedrooms` / `bathrooms` / `year_built_decade` / `school_rating_band` / `distance_band`。
- 聚合统计表：每行一个分组，列 `Group` / `Count` / `Median` / `Mean` / `P25` / `P75` / `Std Dev`。
- 表头客户端排序（`aria-sort`），数值列右对齐 + `tabular-nums`。
- 双轴可视化：左轴 `Count`（柱状），右轴 `Median Price`（折线），X 轴为分组标签。
- 与页面级 **Analysis Filter Bar** 共享筛选条件（区间筛选语义与 Dashboard 对齐）。
- 行级 **Drill Down**：将分组条件合并进全局筛选并跳转 Dashboard。
- 对接后端 `POST /segments/table` 与 `POST /segments/chart`（认证、参数校验、空数据）。
- 基础状态：loading、skeleton、empty、error + retry。
- 基础响应式（sm/md/lg）与 WCAG 基线。

### 2.2 非范围（Out of Scope）

- 多维度同时分组（交叉表、数据透视）。
- 服务端表头排序参数（排序由前端完成）。
- 导出 Segments 聚合表 CSV/Excel（可后续扩展）。
- 自定义分组区间（用户自定义 bucket 宽度）。
- Scenarios、Data Table 子页能力变更。
- 模型训练、特征工程、MLOps。

## 3. 需求与设计基线

### 3.1 需求要点（segments-analysis.md）

| 编号 | 需求 | 设计落点 |
| --- | --- | --- |
| R1 | 用户单选维度进行 group by | `Group By` 下拉，绑定 `segmentDimension` |
| R2 | 聚合表展示统计列 | `SegmentsTab` 数据表 + `SegmentTableVO.rows` |
| R3 | 表头可排序 | 客户端 `aria-sort` 排序按钮 |
| R4 | 数值列右对齐 tabular-nums | `valuation-table-cell-numeric tabular-nums` |
| R5 | 双轴图：左 Count、右 Median Price | ECharts 双 `yAxis` + bar/line series |

### 3.2 业务语义

1. **分析对象**：`house_record`（或前端等价的 `PredictionRecord`）中具备有效价格的记录。
2. **价格字段**：后端聚合使用表字段 `price`（API 契约）；前端展示文案为 **Median Price** / 货币格式，与 Dashboard 一致。
3. **筛选优先**：先应用 Dashboard 对齐的 Min/Max 区间筛选，再按 `segmentDimension` 分组聚合。
4. **空分组**：筛选后无记录 → `rows: []` / `points: []`，HTTP 业务成功（`code: 0`）。

### 3.3 全局约束

- 技术栈：Next.js App Router + React + Tailwind CSS + Shadcn UI + ECharts。
- 视觉：IBM Carbon 倾向（0 圆角、1px 边框、主色 `#0f62fe`）。
- 认证：所有 Segments 请求在查库前校验 `Authorization: Bearer <token>`（与 Dashboard 相同外部 verify 流程）。

## 4. 信息架构与路由设计

```text
Market Analysis (/analysis)
├─ Dashboard        (?tab=dashboard)
├─ Segments           (?tab=segments)    ← 本文档
├─ Scenarios          (?tab=scenarios)
└─ Data Table         (?tab=data)

Segments Tab
├─ Page Header（标题 + Group By）
├─ Filter Bar（与全站共享，位于 AnalysisShell 顶栏）
├─ Summary（filtered / total 计数）
├─ Segment Statistics Table
└─ Segment Count vs Median Price Chart（含等价数据表）
```

### 4.1 路由规则

| 项 | 值 |
| --- | --- |
| 页面路由 | `/analysis` |
| Segments Tab | `/analysis?tab=segments` |
| 筛选参数 | 与 Dashboard 共用 URL query（`squareFootageMin`、`priceMin`、`dims` 等） |
| 分组维度（建议） | `segmentDimension=bedrooms`（可选写入 URL，见 §8.4） |

进入 Segments Tab 时：

- 保留当前 URL 中的筛选参数。
- 若 URL 含合法 `segmentDimension`，作为初始分组维度；否则默认 `bedrooms`。

### 4.2 导航规则

- 左侧 `AnalysisSidenav` 中 `Segments` 项在 `tab=segments` 时设置 `aria-current="page"`。
- 切换 Tab 时通过 `router.replace` 更新 `tab`，不丢失筛选 query。

## 5. 页面结构详细设计

### 5.1 Page Header

| 元素 | 说明 |
| --- | --- |
| 标题 | `Segments`（`h2#analysis-segments-title`） |
| 描述 | 说明在筛选条件下横向对比市场分段，并支持 drill down |
| 控件 | `Group By` 标签 + `Select` 单选下拉 |

**Group By 选项**（值与 API `segmentDimension` 一致）：

| value | 展示文案（UI） |
| --- | --- |
| `bedrooms` | Bedrooms |
| `bathrooms` | Bathrooms |
| `year_built_decade` | Year Built Decade |
| `school_rating_band` | School Rating Band |
| `distance_band` | Distance Band |

交互：

- 变更维度 → 重置表内排序为默认（建议 `median` desc）→ 并行请求 table + chart。
- 控件 `id="analysis-segments-group-by"`，`<label htmlFor=...>` 显式关联。

### 5.2 Summary 区

展示文案（`aria-live="polite"`）：

```text
Showing {filteredCount} filtered records from {totalCount} total records.
```

| 字段 | 来源 |
| --- | --- |
| `filteredCount` | 应用筛选后参与聚合的记录数 |
| `totalCount` | 全库有效价格记录数（与 Dashboard 口径一致） |

> 注：后端若 Table/Chart 响应未携带计数，可由前端在迁移期从 Dashboard 或 records 接口推导；联调后优先使用后端扩展字段或单独 metrics 接口（待确认项 §18）。

### 5.3 聚合统计表（Segment Statistics Table）

#### 5.3.1 列定义

| 列名（UI） | VO 字段 | 类型 | 对齐 | 说明 |
| --- | --- | --- | --- | --- |
| Group | `group` | string | 左（`th scope="row"`） | 展示标签，如 `3`、`1980s`、`6-8` |
| Count | `count` | long | 右 + tabular-nums | 组内记录数 |
| Median | `median` | decimal(2) | 右 + tabular-nums | 价格中位数，USD 格式 |
| Mean | `mean` | decimal(2) | 右 | 价格均值 |
| P25 | `p25` | decimal(2) | 右 | 25 分位 |
| P75 | `p75` | decimal(2) | 右 | 75 分位 |
| Std Dev | `stdDev` | decimal(2) | 右 | 总体标准差 |
| Action | - | - | 左 | `Drill Down` 按钮 |

- `groupKey` 不展示，用于排序与 drill down 映射。
- 提供 `<caption class="sr-only">Segment comparison statistics</caption>`。

#### 5.3.2 排序行为（前端）

| 规则 | 说明 |
| --- | --- |
| 触发 | 点击可排序列表头按钮 |
| 指示 | `th[aria-sort=ascending|descending|none]` |
| 默认 | `median` + `desc` |
| 切换 | 同列：desc → asc →（可选）再点保持 asc；换列：新列默认 desc |
| 比较 | 字符串列 `localeCompare` + `{ numeric: true }`；数值列算术比较 |
| 范围 | 仅对当前已加载 `rows` 排序，不请求服务端 |

#### 5.3.3 行交互

| 行为 | 说明 |
| --- | --- |
| 行选中 | 点击行或 Enter/Space → 高亮行 + 图表对应柱/点高亮 |
| Drill Down | 将分组条件合并进 URL 筛选 → `tab=dashboard` |
| 键盘 | 行 `tabIndex={0}`，Enter/Space 选中 |

#### 5.3.4 Loading / Empty

| 状态 | UI |
| --- | --- |
| loading | 5 行 skeleton（8 列占位条） |
| empty | `No segments match the current filters.`（`role="status"`） |
| error | `role="alert"` + `Retry` |

### 5.4 双轴图（Segment Count vs Median Price）

| 项 | 设计 |
| --- | --- |
| 容器 | `ChartCard`（与 Dashboard 图表一致） |
| 标题 | `Segment Count vs Median Price` |
| 描述 | Count 左轴；Median Price 右轴 |
| X 轴 | `group` 分类；分组 > 6 时标签旋转 30° |
| 左 Y 轴 | `Count`，柱状图，`yAxisIndex: 0` |
| 右 Y 轴 | `Median Price`，折线图，`yAxisIndex: 1`，金额 formatter |
| 系列色 | Count `#0f62fe`；Median `#6929c4`（与现有实现一致） |
| Tooltip | `axis` 触发，展示 group / count / median |
| 点击 | 与表格行选中联动 |
| 无障碍 | `aria-label` 描述图表；`ChartCard` 内提供等价简表（group/count/median） |

数据绑定（Chart 接口）：

- `count` ← `SegmentChartPointVO.count`
- `median` ← `SegmentChartPointVO.medianPrice`

## 6. 分组维度与标签规则

后端分组逻辑须与 API §4.2 一致；前端展示使用 `group`，排序使用 `groupKey`。

### 6.1 bedrooms / bathrooms

| 维度 | groupKey | group 展示 | Drill Down 筛选 |
| --- | --- | --- | --- |
| bedrooms | 卧室数值字符串，如 `"3"` | 原值，如 `3` | `minBedrooms=maxBedrooms=3` |
| bathrooms | 浴室数值字符串，如 `"2"` | 原值，如 `2` | `minBathrooms=maxBathrooms=2` |

### 6.2 year_built_decade

| 规则 | 说明 |
| --- | --- |
| 计算 | `decade = floor(year_built / 10) * 10` |
| groupKey | 十年数字字符串，如 `"1980"` |
| group | `{decade}s`，如 `1980s` |
| Drill Down | `minYearBuilt=decade`，`maxYearBuilt=decade+9` |

### 6.3 school_rating_band（2 分一档）

| school_rating 区间 | groupKey 建议 | group 展示 | Drill Down |
| --- | --- | --- | --- |
| [0, 2) | `0` | `0-2` | `minSchoolRating=0`, `maxSchoolRating=2`（闭区间语义见 §7.4） |
| [2, 4) | `2` | `2-4` | `min=2`, `max=4` |
| [4, 6) | `4` | `4-6` | … |
| [6, 8) | `6` | `6-8` | … |
| [8, 10] | `8` | `8-10` | `min=8`, `max=10` |

> **与现网客户端差异**：当前 `lib/analysis/aggregators.ts` 使用 0–3 / 4–6 / 7–8 / 9–10 四档。联调后端时必须改为 API 约定的 **2 分一档**，展示形如 `6-8`。

### 6.4 distance_band（2 英里一档）

| distance_to_city_center（英里） | groupKey | group 展示 | Drill Down |
| --- | --- | --- | --- |
| [0, 2) | `0` | `0-2` | `minDistanceToCityCenter=0`, `max=2` |
| [2, 4) | `2` | `2-4` | `min=2`, `max=4` |
| [4, 6) | `4` | `4-6` | … |
| … | 每 2 英里递增 | `{low}-{high}` | 对应闭开区间映射 |

上限桶：超过数据最大距离时仍按 2 英里对齐生成桶；无记录桶不出现在结果中。

> **与现网客户端差异**：当前客户端使用 km 文案与非 2 英里分档。后端与详细设计以 **英里 + 2 英里一档** 为准。

### 6.5 排序

- 默认：按 `groupKey` **升序**（API 保证）；前端表头排序可覆盖展示顺序。
- `groupKey` 设计为可数值比较的字符串（卧室、十年、区间下限）。

## 7. 交互流程设计

### 7.1 主流程

```text
进入 /analysis?tab=segments
  -> 读取 URL 筛选 + segmentDimension
  -> 展示 Filter Bar（与 Dashboard 共享状态）
  -> POST /segments/table + POST /segments/chart（并行）
  -> 渲染表 + 双轴图
  -> 用户切换 Group By 或 Apply Filters
  -> 重新并行请求并刷新
```

### 7.2 Drill Down 流程

```text
Segments 表某行 -> Drill Down
  -> 合并：当前 AnalysisFilterInput + 该组 drillDownPatch
  -> router.replace(?tab=dashboard&...)
  -> Dashboard 以合并后筛选加载
```

`drillDownPatch` 由 `groupKey` + `segmentDimension` 查表生成（§6），映射到 `AnalysisFilterInput` 的 `*Min`/`*Max` 字段，再经 `toDashboardQueryRequest` 转为后端字段名。

### 7.3 筛选变更流程

```text
Filter Bar Apply
  -> 更新 URL query（保持 tab=segments）
  -> AnalysisShell useEffect 触发 loadSegments
  -> 表 + 图刷新；保留 groupBy 除非 URL 显式携带 segmentDimension
```

## 8. 状态机与数据流

### 8.1 AnalysisShell 中的 Segments 状态

```ts
type SegmentsPageState = {
  segmentDimension: AnalysisSegmentGroupKey;
  table: SegmentTableVO | null;
  chart: SegmentChartVO | null;
  filteredCount: number;
  totalCount: number;
  loading: boolean;
  error: string | null;
};
```

加载策略：

1. `currentTab === "segments"` 时才请求。
2. `filters` 或 `segmentDimension` 变化时触发。
3. `Promise.all([fetchTable, fetchChart])` 并行；任一失败展示统一 error。

### 8.2 SegmentsTab 本地状态

```ts
type SegmentSort = { field: SegmentSortField; order: "asc" | "desc" };
// SegmentSortField = "group" | "count" | "median" | "mean" | "p25" | "p75" | "stdDev"

selectedGroupKey: string | null;  // 表/图联动高亮
sort: SegmentSort;                // 仅影响展示顺序
```

### 8.3 错误处理

| 场景 | 行为 |
| --- | --- |
| 401 / Token 无效 | 跳转登录或展示未授权（与全站一致） |
| 400 参数错误 | 展示参数错误文案；Group By 回退或保留上次合法值 |
| 5xx / 网络 | `Failed to load segment data.` + Retry |
| 部分成功（table 成功 chart 失败） | 建议整页 error，避免表图不一致 |

## 9. 数据模型与接口契约

### 9.1 与 API 对齐的 TypeScript 类型

```ts
/** 与 API SegmentQueryRequest 对齐 */
export type SegmentQueryRequest = {
  segmentDimension: AnalysisSegmentGroupKey;
  minId?: number;
  maxId?: number;
  minSquareFootage?: number;
  maxSquareFootage?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  minLotSize?: number;
  maxLotSize?: number;
  minDistanceToCityCenter?: number;
  maxDistanceToCityCenter?: number;
  minSchoolRating?: number;
  maxSchoolRating?: number;
  minPrice?: number;
  maxPrice?: number;
  filters?: Partial<SegmentQueryRequest>;
};

export type SegmentGroupRowVO = {
  group: string;
  groupKey: string;
  count: number;
  median: number;
  mean: number;
  p25: number;
  p75: number;
  stdDev: number;
};

export type SegmentTableVO = {
  segmentDimension: AnalysisSegmentGroupKey;
  rows: SegmentGroupRowVO[];
};

export type SegmentChartPointVO = {
  group: string;
  groupKey: string;
  count: number;
  medianPrice: number;
};

export type SegmentChartVO = {
  segmentDimension: AnalysisSegmentGroupKey;
  points: SegmentChartPointVO[];
};
```

### 9.2 UI 类型映射

```ts
/** 前端表行（SegmentsTab 消费） */
export type AnalysisSegmentRow = {
  id: string;              // = groupKey
  group: string;
  count: number;
  median: number;
  mean: number;
  p25: number;
  p75: number;
  stdDev: number;
  filterPatch: Partial<AnalysisFilterInput>;  // drill down
};

export type AnalysisSegmentsResult = {
  groupBy: AnalysisSegmentGroupKey;
  rows: AnalysisSegmentRow[];
  filteredCount: number;
  totalCount: number;
};
```

映射函数 `mapSegmentTableToAnalysisResult(table, chart, counts)`：

- 校验 `table.segmentDimension === chart.segmentDimension`。
- 按 `groupKey` 合并；`median` 与 `medianPrice` 必须相等（验收点 API §10）。
- `id = groupKey`；`filterPatch = buildDrillDownPatch(segmentDimension, groupKey)`。

### 9.3 AnalysisFilterInput → SegmentQueryRequest

复用 `toDashboardQueryRequest` 的字段映射思路，新增：

```ts
export function toSegmentQueryRequest(
  filters: AnalysisFilterInput,
  segmentDimension: AnalysisSegmentGroupKey,
): SegmentQueryRequest {
  const base = toDashboardQueryRequest(filters);
  // 剔除 Dashboard 专有：priceBucketCount, scatterLimit
  const { priceBucketCount, scatterLimit, ...range } = base;
  return { ...range, segmentDimension };
}
```

| AnalysisFilterInput | SegmentQueryRequest |
| --- | --- |
| `squareFootageMin` | `minSquareFootage` |
| `squareFootageMax` | `maxSquareFootage` |
| `bedroomsMin` | `minBedrooms` |
| `bedroomsMax` | `maxBedrooms` |
| `bathroomsMin` | `minBathrooms` |
| `bathroomsMax` | `maxBathrooms` |
| `yearBuiltMin` | `minYearBuilt` |
| `yearBuiltMax` | `maxYearBuilt` |
| `lotSizeMin` | `minLotSize` |
| `lotSizeMax` | `maxLotSize` |
| `distanceToCityCenterMin` | `minDistanceToCityCenter` |
| `distanceToCityCenterMax` | `maxDistanceToCityCenter` |
| `schoolRatingMin` | `minSchoolRating` |
| `schoolRatingMax` | `maxSchoolRating` |
| `priceMin` | `minPrice` |
| `priceMax` | `maxPrice` |

**不映射**到 Segments 请求：`keyword`、`region`、`propertyType`、`sort`、`order`、`page`、`size`、`highlightId`、`activeDimensions`（维度筛选 UI 状态仅用于控制 Filter Bar 展示哪些区间字段）。

### 9.4 URL 参数（可选增强）

| 参数 | 说明 |
| --- | --- |
| `segmentDimension` | 与 API 枚举一致；非法值忽略并用默认 `bedrooms` |
| 与 filters 共用 | 现有 `serializeAnalysisFilters` 键集合 |

`serializeAnalysisFilters` 扩展：在 `tab=segments` 时写入 `segmentDimension`。

### 9.5 BFF / Next.js 路由代理

建议新增（与 `/api/dashboard` 模式一致）：

| 路径 | 方法 | 转发 |
| --- | --- | --- |
| `/api/segments/table` | POST | 后端 `/segments/table` |
| `/api/segments/chart` | POST | 后端 `/segments/chart` |

代理职责：

1. 从 cookie/session 注入 `Authorization`。
2. `sanitize` 请求体，仅保留 `SegmentQueryRequest` 文档字段。
3. 透传 `BaseResponse`；统一 `readApiResponse` 解析。

### 9.6 前端服务 API

```ts
export async function getAnalysisSegments(
  filters: AnalysisFilterInput,
  segmentDimension: AnalysisSegmentGroupKey,
): Promise<AnalysisSegmentsResult> {
  const body = toSegmentQueryRequest(filters, segmentDimension);
  const [tableRes, chartRes] = await Promise.all([
    fetch("/api/segments/table", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    fetch("/api/segments/chart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  ]);
  // 解析、校验一致性、映射为 AnalysisSegmentsResult
}
```

**迁移策略**：

1. 优先调用后端双接口。
2. 若 404 或环境未就绪，回退 `buildAnalysisSegments(records, filters, groupBy)`（现有客户端聚合），并在开发环境 console 提示。
3. 回退路径须将 band 规则对齐 §6.3、§6.4，避免与生产后端不一致。

## 10. 后端实现要点（供后端 / DBA）

> 完整表结构与 SQL 见 `docs/spec/segement/normalCR/db-design/segments-db-design.md`（规划文档）；本节给出与 API 对齐的实现约束。

### 10.1 处理流程

```text
校验 Authorization
  -> 合并 body / query / filters（body 优先）
  -> 校验 segmentDimension + 区间参数
  -> 构建 WHERE（区间筛选）
  -> 按维度表达式 GROUP BY
  -> 聚合 COUNT / MEDIAN / AVG / PERCENTILE / STDDEV_POP(price)
  -> 按 groupKey 升序返回
```

### 10.2 统计口径

| 指标 | SQL 建议 | 备注 |
| --- | --- | --- |
| count | `COUNT(*)` | |
| median | `PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price)` 或等价 | 保留 2 位小数 |
| mean | `AVG(price)` | |
| p25 / p75 | `PERCENTILE_CONT(0.25/0.75)` | |
| stdDev | `STDDEV_POP(price)` | 组内 n=1 时返回 0 |
| n=1 | median=mean=p25=p75=price | API §5.4 |

### 10.3 Chart 与 Table

- 相同 `SegmentQueryRequest` 必须共享同一 WHERE 与 GROUP BY。
- Chart 仅 SELECT `group`, `groupKey`, `count`, `median AS medianPrice`。
- 禁止 Table 与 Chart 分别缓存导致不一致。

## 11. 前端实现设计

### 11.1 文件规划

```text
lib/analysis/
├─ segments-api.ts          # SegmentQueryRequest、VO、toSegmentQueryRequest、fetch
├─ segments-drilldown.ts    # groupKey -> AnalysisFilterInput patch
└─ services.ts              # getAnalysisSegments 改为调 API

app/api/segments/
├─ table/route.ts
└─ chart/route.ts

app/components/analysis/segments/
└─ segments-tab.tsx         # 已有；对齐 VO 字段与 band 展示
```

### 11.2 组件职责

| 组件 | 职责 |
| --- | --- |
| `AnalysisShell` | segments 状态、loadSegments、drill down 路由、Filter 共享 |
| `SegmentsTab` | Group By、表排序、图、空错态、行选中 |
| `AnalysisFilterBar` | 不改 Segments 专有逻辑，仅触发全局 filters 更新 |

### 11.3 与现网实现差异清单

| 项 | 现网 | 目标 |
| --- | --- | --- |
| 数据源 | 全量 predictions 客户端聚合 | 后端 `/segments/table` + `/segments/chart` |
| school_rating_band | 四档非 2 分 | 2 分一档 `0-2`…`8-10` |
| distance_band | km 文案、非 2mi | 英里 `0-2`、`2-4`… |
| group 标签 | 英文长文案如 `3 bedrooms` | API 短标签：`3`、`1980s`、`6-8` |
| row id | 自定义 id | `groupKey` |
| chart 数据 | 从 table rows 推导 | 独立 chart 接口，校验一致 |

## 12. 视觉与样式设计

- 复用 `analysis-segments-*`、`valuation-table-*`、`analysis-chart-canvas` 类名。
- 表头排序按钮：`valuation-table-sort-btn`，激活态 `data-active=true`。
- 数值列：`valuation-table-cell-numeric tabular-nums`。
- 图表卡片：与 Dashboard `ChartCard` 一致边框与标题层级。
- 选中行：`valuation-table-row-highlight`；图表柱/点加粗描边 `#0f62fe`。

## 13. 可访问性设计

| 项 | 要求 |
| --- | --- |
| 区域 | `section[aria-labelledby=analysis-segments-title]` |
| 表 | `caption`（sr-only）、`scope="col"` / `scope="row"` |
| 排序 | `aria-sort` on `th` |
| 图 | `aria-label`；ChartCard 内等效数据表 |
| 错误 | `role="alert"` |
| 空态 | `role="status"` |
| 计数 | summary `aria-live="polite"` |
| Group By | `label` + `id` 关联 |
| 键盘 | 行选中、排序按钮、Retry 均可键盘操作 |

## 14. 响应式设计

| 断点 | 行为 |
| --- | --- |
| lg (≥1024) | 表全宽；图在表下方全宽 |
| md | 表横向滚动；图保持高度 ≥ 280px |
| sm | Group By 与标题纵向堆叠；表 `overflow-x: auto` |

## 15. 安全与鲁棒性

- Token 校验失败不返回聚合数据。
- 请求体白名单字段，忽略未知键。
- 前端展示对 `group` 字符串默认转义（React 文本节点）。
- Drill down 仅合并合法数值区间，防止 NaN 进入 URL。
- 并行请求使用相同 request body 快照，避免筛选中途变更导致表图不一致。

## 16. 测试设计

### 16.1 接口 / 集成

| # | 用例 |
| --- | --- |
| 1 | 无 Token → 401，无 DB 查询 |
| 2 | 缺 `segmentDimension` → 400 |
| 3 | 非法 `segmentDimension` → 400 |
| 4 | 仅 `segmentDimension=bedrooms` → 按卧室分组，groupKey 升序 |
| 5 | 带 `minPrice`/`maxPrice` → 先筛选再分组 |
| 6 | 筛选无数据 → `rows:[]` / `points:[]`，code 0 |
| 7 | 相同 body 调 table + chart → groupKey 集合、count、median 一致 |
| 8 | 单条组内记录 → stdDev=0，分位数等于价格 |

### 16.2 前端手工

| # | 用例 |
| --- | --- |
| 1 | `/analysis?tab=segments` 展示 Group By、表、图 |
| 2 | 切换维度，表与图同步更新 |
| 3 | Apply Filter 后 segments 刷新且 tab 不变 |
| 4 | 表头排序 asc/desc/aria-sort 正确 |
| 5 | 点击行高亮且图表联动 |
| 6 | Drill Down 跳转 dashboard 且筛选包含该组 |
| 7 | 空筛选无数据空态 |
| 8 | 断网 Retry 可恢复 |
| 9 | 键盘完成排序、选中、Drill Down |

### 16.3 自动化建议

- **Unit**：`toSegmentQueryRequest`、`buildDrillDownPatch`、VO → `AnalysisSegmentRow` 映射。
- **RTL**：`SegmentsTab` 排序、空态、error。
- **Contract**：table/chart 响应 schema 快照测试。

## 17. 验收标准

- [ ] 用户可在 Segments 页单选五种维度之一查看分组聚合表。
- [ ] 表包含 Group / Count / Median / Mean / P25 / P75 / Std Dev，数值列右对齐 tabular-nums。
- [ ] 表头支持客户端排序且具备正确 `aria-sort`。
- [ ] 双轴图左轴 Count、右轴 Median Price，与表使用相同筛选与维度。
- [ ] `POST /segments/table` 与 `POST /segments/chart` 在有效 Token 下可用，且分组与中位数一致。
- [ ] 区间筛选语义与 Dashboard 一致（Min/Max/仅 Min/仅 Max）。
- [ ] 筛选后无数据返回空表/空图，非 5xx。
- [ ] Drill Down 将用户带到 Dashboard 并应用该组区间筛选。
- [ ] sm/md/lg 下表可滚动、核心操作可键盘完成。
- [ ] `npm run lint` 通过。

## 18. 实施顺序建议

1. 新增 `lib/analysis/segments-api.ts` 与 `segments-drilldown.ts`，完成类型与映射。
2. 新增 Next.js `app/api/segments/table|chart` 代理。
3. 修改 `getAnalysisSegments` 并行调用双接口；保留客户端回退。
4. 对齐 `aggregators.ts` 中 band 规则（回退路径与后端一致）。
5. 调整 `SegmentsTab` 展示标签（`group` 短格式）与 `groupKey` 选中逻辑。
6. （可选）URL 增加 `segmentDimension`。
7. 联调、补测试、更新需求文档 Summary（§1.1 TBD）。

## 19. 风险与待确认项

| # | 项 | 建议 |
| --- | --- | --- |
| 1 | `filteredCount` / `totalCount` 是否由 Segments API 返回 | 若否，前端从 Dashboard metrics 或单独 count 接口获取 |
| 2 | 价格字段是成交价还是模型预测价 | 与 `house_record.price` 业务定义对齐；UI 文案统一 |
| 3 | 区间边界开闭（如 2 英里是否归入 `2-4`） | 与 Dashboard、DB 设计统一；单测覆盖边界值 |
| 4 | 客户端 km 与 API 英里 | 全链路统一为英里；UI 轴标题注明单位 |
| 5 | `db-design/segments-db-design.md` 尚未落盘 | 后端实现前补齐 SQL 文档 |
| 6 | 需求文档 Summary 仍为 TBD | 产品补全后同步 §3.1 |

## 20. 文档修订记录

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| 1.0 | 2026-05-19 | 初版：基于 segments-analysis 需求与 segments-api-design 输出 |
