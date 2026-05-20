# Scenarios What-if 前端开发任务文档（normalCR）

## 1. 任务目标

依据 **需求**、**API 设计**、**前端详细设计**，将 Scenarios What-if 拆分为可排期、可分配、可验收的前端工作项（含本仓库 Next.js BFF），确保：

| # | 目标 |
| --- | --- |
| G1 | `/analysis?tab=scenarios` 可用，与 Analysis Filter Bar 共享筛选 |
| G2 | Baseline 来自 `POST /what-if/baseline`（median 特征 + `baselinePredictedPrice`） |
| G3 | 场景预测来自 `POST /what-if/scenarios/predict`（单笔 `features`） |
| G4 | 价差 / 变化率 / 特征 diff 由前端计算（API §7） |
| G5 | 空数据、401、参数错误、预测不可用有完整 UI 态 |
| G6 | `npm run lint` 通过，满足 A11y 基线 |

**关联文档**

| 文档 | 路径 |
| --- | --- |
| 需求 | `docs/spec/scenarios-what-if/normalCR/requirements/scenarios-what-if.md` |
| API 设计 | `docs/spec/scenarios-what-if/normalCR/api-design/scenarios-what-if-api-design.md` |
| 前端详细设计 | `docs/spec/scenarios-what-if/normalCR/detail-design/scenarios-what-if-detail-design.md` |
| 参考实现 | `lib/analysis/segments-api.ts`、`segments-route-utils.ts`、`app/api/segments/*` |

---

## 2. 范围与边界

### 2.1 In Scope（前端 + BFF）

- `lib/analysis/what-if-*.ts`、`scenarios.ts`、`services.ts`、`types.ts`
- `app/api/what-if/baseline`、`app/api/what-if/scenarios/predict`
- `AnalysisShell`、`ScenariosTab`、`ScenarioFeatureForm`、`ScenarioResultPanel`、`AnalysisPageHeader`
- Data Table → Scenarios 特征 seed
- 单测 / RTL 建议、手工用例、lint

### 2.2 Out of Scope

- marketing-service Java 实现（见 [附录 A](#附录-a-后端联调依赖非前端排期)）
- 批次 `featuresList` 多场景 UI
- 场景历史、URL 持久化特征、PDF 导出
- Segments / Dashboard 功能变更

---

## 3. 需求与 API 追溯矩阵

### 3.1 需求 → 前端任务

| 需求 | 说明 | 前端任务 ID |
| --- | --- | --- |
| R1 | Filter → median 特征 Baseline | FE-101～FE-105、FE-201～FE-203、FE-301 |
| R2 | Baseline 预测价 | FE-105、FE-203 |
| R3 | 场景特征预测 | FE-106、FE-204、FE-401 |
| R4 | 与 Baseline 对比 | FE-107、FE-402、FE-403 |

### 3.2 API → BFF → 页面

| API（marketing-service） | BFF（Next.js） | 消费方 | 任务 ID |
| --- | --- | --- | --- |
| `POST /what-if/baseline` | `POST /api/what-if/baseline` | `fetchWhatIfBaseline` → Shell `loadBaseline` | FE-201～FE-203、FE-301 |
| `POST /what-if/scenarios/predict` | `POST /api/what-if/scenarios/predict` | `predictScenario` → `runScenario` | FE-204、FE-302 |
| —（§7 前端对比） | — | `buildScenarioResult`、`buildFeatureDiffRows` | FE-107、FE-402～FE-403 |

### 3.3 详细设计章节 → 任务

| 详细设计 | 任务 ID |
| --- | --- |
| §5 页面结构（Baseline / 表单 / 结果） | FE-401～FE-403 |
| §7 交互流程 | FE-301～FE-302 |
| §8 状态机 | FE-301 |
| §9 数据模型与 BFF | FE-101～FE-106、FE-201～FE-204 |
| §13～§14 A11y / 响应式 | FE-501 |
| §16～§17 测试与验收 | FE-601 |

---

## 4. 前端任务分解（WBS）

> **编号说明**：`FE-0xx` 准备 · `FE-1xx` 契约与领域 · `FE-2xx` BFF · `FE-3xx` Shell 编排 · `FE-4xx` UI 组件 · `FE-5xx` 体验 · `FE-6xx` 质量  
> **工作量**：S ≤ 0.5d · M ≤ 1d · L ≤ 2d（供排期参考）

---

### 阶段 0：准备（FE-0xx）

#### FE-001｜开发准备与参数冻结 【S】

| 项 | 内容 |
| --- | --- |
| **目标** | 消除联调与产品歧义 |
| **子任务** | 确认 `WHAT_IF_API_BASE_URL`（默认同 Segments `8003`）；BFF 成功码 `0 \| 200`；是否保留「Start from a record」；无数据错误文案透传策略；Mock/真实后端就绪时间 |
| **产出** | PR/change-log 参数记录 |
| **验收** | 无阻塞项再进入 FE-1xx |
| **依赖** | — |

---

### 阶段 1：契约与领域逻辑（FE-1xx）

#### FE-101｜What-if 类型与筛选映射 【M】

| 项 | 内容 |
| --- | --- |
| **目标** | `what-if-api.ts` 契约层 |
| **子任务** | 定义 `WhatIfBaselineQueryRequest`、`BaselineVO`、`HouseFeaturesVO`、`ScenarioPredictRequest`、`ScenarioPredictVO`；实现 `toWhatIfBaselineQueryRequest`（剔除 `priceBucketCount`/`scatterLimit`）；`sanitize*` 白名单；`normalize*VO`；`mapBaselineVoToScenarioBaseline` |
| **文件** | 新增 `lib/analysis/what-if-api.ts` |
| **验收** | 字段与 API §4.2、§5.2 一致；单测覆盖映射 |
| **依赖** | FE-001 |
| **追溯** | R1、详细设计 §9.1～§9.3 |

#### FE-102｜分析类型演进 【S】

| 项 | 内容 |
| --- | --- |
| **子任务** | `ScenarioBaseline`: `source: "filterMedian"`、`recordCount`、可选 `scenarioSeedRecordId`；`ScenarioResult.deltaPercent: number \| null` |
| **文件** | `lib/analysis/types.ts` |
| **依赖** | FE-101 |

#### FE-103｜场景工具函数改造 【M】

| 项 | 内容 |
| --- | --- |
| **子任务** | `buildScenarioResult` 支持 `deltaPercent: null`；`SCENARIO_FIELD_LIMITS` 对齐 API §5.3（`lotSize.min = 1`）；`validateScenarioFeatures` 对齐；**删除** `averageFeatures`、`buildDatasetAverageBaseline`、`buildRecordBaseline` |
| **文件** | `lib/analysis/scenarios.ts` |
| **验收** | 无引用已删函数；单测 delta / null percent |
| **依赖** | FE-102 |
| **追溯** | R4、API §7 |

#### FE-104｜分析服务层 【M】

| 项 | 内容 |
| --- | --- |
| **子任务** | `fetchWhatIfBaseline(filters)`；`predictScenario(features)`；改造 `runScenario`；401/400/502 → `ValuationApiError`；**不做** Baseline 客户端回退 |
| **文件** | `lib/analysis/services.ts` |
| **验收** | Shell 仅调 service，不直接 fetch BFF |
| **依赖** | FE-103、FE-204 |
| **追溯** | R2、R3 |

#### FE-105｜服务层单测（建议） 【S】

| 项 | 内容 |
| --- | --- |
| **子任务** | Mock `fetch` 覆盖 baseline 成功/400/401；predict 取 `predictedPrice` / `predictions[0]` |
| **依赖** | FE-104 |

---

### 阶段 2：BFF（FE-2xx）

#### FE-201｜What-if 配置 【S】

| 项 | 内容 |
| --- | --- |
| **子任务** | `WHAT_IF_API_BASE_URL`；`getWhatIfBaselineApiUrl()`、`getWhatIfScenarioPredictApiUrl()` |
| **文件** | 新增 `lib/analysis/what-if-config.ts` |
| **依赖** | FE-101 |

#### FE-202｜路由转发工具 【M】

| 项 | 内容 |
| --- | --- |
| **子任务** | `forwardWhatIfBaselineRequest`、`forwardWhatIfScenarioPredictRequest`；Cookie → Bearer；401/400/502 映射；`isDashboardApiSuccess` |
| **文件** | 新增 `lib/analysis/what-if-route-utils.ts` |
| **参考** | `segments-route-utils.ts` |
| **依赖** | FE-201 |

#### FE-203｜Next.js API Routes 【S】

| 项 | 内容 |
| --- | --- |
| **子任务** | `app/api/what-if/baseline/route.ts`；`app/api/what-if/scenarios/predict/route.ts`；空 body / JSON 异常处理 |
| **依赖** | FE-202 |
| **追溯** | API §4、§5 |

#### FE-204｜BFF 联调验收 【M】

| 项 | 内容 |
| --- | --- |
| **子任务** | curl/Postman：有 Token baseline `{}`；带 filter；无数据 400；predict 合法/非法 features |
| **依赖** | FE-203、附录 A 后端就绪或 Mock |
| **阻塞** | 无后端时可先完成 FE-201～FE-203 代码，联调标为待办 |

---

### 阶段 3：页面编排（FE-3xx）

#### FE-301｜AnalysisShell Baseline 生命周期 【L】

| 项 | 内容 |
| --- | --- |
| **子任务** | 状态：`baselineLoading`、`baselineError`、`featuresDirty`；`loadBaseline()`：`tab===scenarios` 且 `filters` 变化触发；成功重置 `scenarioFeatures`（`!featuresDirty`）、清空 `scenarioResult`；`handleApplyFilters` 强制刷新 baseline；`handleRunScenario`；**AbortController** 防过期响应 |
| **文件** | `analysis-shell.tsx` |
| **验收** | 进 Tab 自动 baseline；Apply Filter 刷新并清空旧结果 |
| **依赖** | FE-104 |
| **追溯** | 详细设计 §7.1、§8.1 |

#### FE-302｜Data Table 特征 seed 【S】

| 项 | 内容 |
| --- | --- |
| **子任务** | `handleUseBaseline(record)`：跳转 `tab=scenarios`；`setScenarioFeatures(record.features)`；`featuresDirty=true`；**不**改 baseline 价；`setScenarioResult(null)` |
| **文件** | `analysis-shell.tsx` |
| **追溯** | 详细设计 §7.4 |

#### FE-303｜ScenariosTab Props 契约 【S】

| 项 | 内容 |
| --- | --- |
| **子任务** | 定义并落地新 Props（baseline 加载态、refresh/retry 回调）；移除对 `records`/`onBaselineChange` 依赖 |
| **依赖** | FE-301 |

---

### 阶段 4：UI 组件（FE-4xx）

#### FE-401｜ScenariosTab Baseline 区重构 【M】

| 项 | 内容 |
| --- | --- |
| **子任务** | 移除「From dataset average」「From a prediction record」作 Baseline；展示 `recordCount` + median 文案 + `formatUsd`；`Refresh baseline`；loading/error + Retry |
| **文件** | `scenarios-tab.tsx` |
| **验收** | 不再出现 mean baseline 按钮 |
| **依赖** | FE-303 |
| **追溯** | 详细设计 §5.2 |

#### FE-402｜ScenarioFeatureForm 【S】

| 项 | 内容 |
| --- | --- |
| **子任务** | `disabled` 绑定 baseline 与 loading；Run 前校验；Reset 恢复 `baseline.features` |
| **文件** | `scenario-feature-form.tsx` |
| **依赖** | FE-103 |

#### FE-403｜ScenarioResultPanel 【S】

| 项 | 内容 |
| --- | --- |
| **子任务** | 价格双卡 + 差额文案；`deltaPercent === null` → `-`；特征 diff 表；loading/error/empty |
| **文件** | `scenario-result-panel.tsx` |
| **追溯** | R4、API §7 |

#### FE-404｜（可选）Start from a record 【S】

| 项 | 内容 |
| --- | --- |
| **子任务** | 保留 `ComparisonSelectionDialog`，仅写入场景特征，不调 baseline API |
| **依赖** | FE-401 |
| **备注** | 产品确认后做；否则跳过 |

#### FE-405｜AnalysisPageHeader 文案 【S】

| 项 | 内容 |
| --- | --- |
| **子任务** | `scenarios.title = "Scenarios"`；subtitle 说明 median baseline + what-if |
| **文件** | `analysis-page-header.tsx` |

---

### 阶段 5：体验（FE-5xx）

#### FE-501｜A11y 与响应式 【M】

| 项 | 内容 |
| --- | --- |
| **子任务** | `aria-label` / `aria-live` / `role="alert"`；表单 `aria-invalid`；键盘 Run/Reset/Refresh/Retry；375/768/1280 回归 |
| **追溯** | 详细设计 §13～§14 |

---

### 阶段 6：质量与交付（FE-6xx）

#### FE-601｜测试与验收 【M】

| 项 | 内容 |
| --- | --- |
| **子任务** | `npm run lint`；手工用例（详细设计 §16.3）；API §10 经 BFF 验证；RTL：`ScenarioResultPanel`、`ScenariosTab` error；勾选详细设计 §17 |
| **产出** | 测试记录 + 已知限制（后端未就绪等） |

#### FE-602｜文档同步（可选） 【S】

| 项 | 内容 |
| --- | --- |
| **子任务** | 更新 `requirements` §1.1 Summary；change-log |

---

## 5. 里程碑与推荐排期

| 里程碑 | 工作项 | 累计交付 |
| --- | --- | --- |
| **M1** 契约就绪 | FE-001、FE-101～FE-103 | 类型 + 纯函数可单测 |
| **M2** BFF 可联调 | FE-201～FE-204 | `/api/what-if/*` |
| **M3** 端到端数据流 | FE-104、FE-301～FE-303 | Shell 自动 baseline + predict |
| **M4** UI 完整 | FE-401～FE-405 | Scenarios 页可用 |
| **M5** 交付 | FE-501、FE-601～FE-602 | 验收通过 |

```text
FE-001
  └─ FE-101 ─ FE-102 ─ FE-103 ────────────────┐
       ├─ FE-201 ─ FE-202 ─ FE-203 ─ FE-204 ─┼─ FE-104 ─ FE-301 ─ FE-303 ─ FE-401
       │                                       │              ├─ FE-302
       │                                       │              └─ FE-402, FE-403
       └─ (并行)                               └─ FE-405
  FE-404（可选）依赖 FE-401
  FE-501 依赖 FE-401～FE-403
  FE-601 依赖全部
```

---

## 6. 任务依赖一览

| 任务 | 前置 | 可并行 |
| --- | --- | --- |
| FE-001 | — | — |
| FE-101 | FE-001 | — |
| FE-102 | FE-101 | — |
| FE-103 | FE-102 | FE-201 |
| FE-201 | FE-101 | FE-103 |
| FE-202 | FE-201 | FE-103 |
| FE-203 | FE-202 | — |
| FE-204 | FE-203 | 后端/Mock |
| FE-104 | FE-103、FE-203 | — |
| FE-301 | FE-104 | — |
| FE-302 | FE-301 | FE-401 |
| FE-303 | FE-301 | — |
| FE-401 | FE-303 | FE-402 |
| FE-402 | FE-103 | FE-403 |
| FE-403 | FE-103 | FE-402 |
| FE-404 | FE-401 | 可选 |
| FE-405 | — | 任意 |
| FE-501 | FE-401～403 | — |
| FE-601 | FE-204、FE-301、FE-401～403、FE-501 | — |

---

## 7. 文件变更清单

| 操作 | 路径 |
| --- | --- |
| 新增 | `lib/analysis/what-if-api.ts` |
| 新增 | `lib/analysis/what-if-config.ts` |
| 新增 | `lib/analysis/what-if-route-utils.ts` |
| 新增 | `app/api/what-if/baseline/route.ts` |
| 新增 | `app/api/what-if/scenarios/predict/route.ts` |
| 修改 | `lib/analysis/types.ts` |
| 修改 | `lib/analysis/scenarios.ts` |
| 修改 | `lib/analysis/services.ts` |
| 修改 | `app/components/analysis/analysis-shell.tsx` |
| 修改 | `app/components/analysis/scenarios/scenarios-tab.tsx` |
| 修改 | `app/components/analysis/scenarios/scenario-feature-form.tsx` |
| 修改 | `app/components/analysis/scenarios/scenario-result-panel.tsx` |
| 修改 | `app/components/analysis/analysis-page-header.tsx` |
| 按需 | `app/globals.css`、`*.test.ts(x)` |

---

## 8. Definition of Done（前端）

### 8.1 功能（对照需求 R1～R4）

- [ ] **R1**：当前 Filter 下展示 median `features` 与 `recordCount`
- [ ] **R2**：展示 `baselinePredictedPrice`（来自 baseline 接口）
- [ ] **R3**：Run Scenario 后展示场景预测价（来自 predict 接口）
- [ ] **R4**：展示价差、变化率（baseline=0 时 `-`）、7 维特征 diff 表

### 8.2 交互（对照详细设计 §7）

- [ ] 进入 `tab=scenarios` 自动 `loadBaseline`
- [ ] Apply Filter 刷新 baseline，清空旧 scenario 结果
- [ ] Reset 恢复 baseline.features；Refresh 手动重拉 baseline
- [ ] Data Table 仅 seed 特征，baseline 价仍为 filter median

### 8.3 工程

- [ ] 已删除客户端 mean baseline 逻辑
- [ ] BFF sanitize + Bearer 与 Segments 一致
- [ ] `npm run lint` 通过

### 8.4 体验

- [ ] Loading / error / empty 矩阵 §5.5 全覆盖
- [ ] 键盘可完成主路径；关键 `aria-*` 正确

---

## 9. 风险与应对

| # | 风险 | 应对 | 关联任务 |
| --- | --- | --- | --- |
| 1 | 后端未上线 | Mock + 先完成 FE-101～103、FE-401～403 | FE-204 |
| 2 | Filter 连点 baseline 错乱 | AbortController | FE-301 |
| 3 | `code:0` vs `200` | `isDashboardApiSuccess` | FE-202 |
| 4 | 记录价当 Baseline 的产品诉求 | 仅 FE-404 seed 特征 | FE-302 |
| 5 | predict dev 回退掩盖问题 | 禁止生产回退 | FE-104 |

---

## 10. 执行检查清单

**阶段 1～2（契约 + BFF）**

- [ ] FE-001
- [ ] FE-101、FE-102、FE-103
- [ ] FE-201、FE-202、FE-203、FE-204

**阶段 3～4（编排 + UI）**

- [ ] FE-104、FE-105（可选）
- [ ] FE-301、FE-302、FE-303
- [ ] FE-401、FE-402、FE-403、FE-405
- [ ] FE-404（可选）

**阶段 5～6（体验 + 交付）**

- [ ] FE-501
- [ ] FE-601、FE-602（可选）

---

## 附录 A：后端联调依赖（非前端排期）

| ID | 说明 | 阻塞前端 |
| --- | --- | --- |
| BE-1 | `POST /what-if/baseline` | FE-204、FE-301 |
| BE-2 | `POST /what-if/scenarios/predict` | FE-204、FE-104 |
| BE-3 | 认证 + 筛选合并 + §6 校验 | FE-204 |
| BE-4 | API 设计 §10 验收 | FE-601 |

前端在后端未就绪时：用 Mock 完成 FE-101～103、FE-401～403；FE-204/FE-601 标「待联调」。

---

## 11. 文档修订记录

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| 1.0 | 2026-05-20 | 初版 WBS |
| 1.1 | 2026-05-20 | 重构为前端专用：FE 编号、需求/API 追溯、分阶段里程碑、附录后端依赖 |
