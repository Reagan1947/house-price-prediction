# App Portal 页面详细设计（normalCR）

## 1. 文档目标

基于以下输入，输出 App Portal（应用选择门户）可实施详细设计，作为前端开发、联调与验收依据：

- 需求文档：`docs/spec/app-portal/app-portal-requirements.md`
- 全局设计约束：`docs/global-info/deisgn.md`
- 全局技术约束：`docs/global-info/techo-design.md`
- 无障碍/交互参考：`docs/skills/wcag/references/*.md`
- Figma：<https://www.figma.com/design/M2IiAGmNgLFwWveEkq3v5C/Untitled?node-id=3-370>

## 2. 范围定义

### 2.1 本次范围（In Scope）

- 登录后进入的应用选择门户页面（建议主路由：`/portal`）。
- Portal 的两类子页面：
  - `Home Page`
  - `Application List`
- 左侧导航切换（Home Page / Application List）。
- Home Page 三个区域：`Shortcut`、`Advice`、`Recently`。
- Application List 的应用列表展示（卡片列表/表格列表二选一，本文按卡片网格 + 检索条设计）。
- 基础响应式适配（sm/md/lg）。
- WCAG 导向的可访问性实现（语义、键盘、焦点、状态可感知）。

### 2.2 非范围（Out of Scope）

- 后端用户权限与鉴权系统实现。
- 具体业务应用（Valuation / Analysis 等）内部功能实现。
- 多租户主题切换与国际化。
- 通知中心、搜索推荐算法。

## 3. 需求与设计基线

### 3.1 需求要点（来自需求文档）

- 应用选择门户包含两个子页面，左侧导航可见：
  - Home Page
  - Application List
- Home Page 包含三个区域：
  - Shortcut：快速访问用户可访问 APP
  - Advice：应用使用建议卡片
  - Recently：近期用户操作
- Application List：展示用户可访问应用列表。

### 3.2 Figma 结构映射（已确认节点）

> 注：当前可读取到的主设计节点为 `3:370 / 3:371`（Portal-Home_Page）。Application List 未在同一节点结构中明确展开，本文按需求补全可实施方案。

- 画布：`3:370 (Portal-Home_Page)`
- 主 Frame：`3:371 (ExxonMobil PRD Page Generator)`，约 `2560 x 1199`
- Header：`3:373`，高 `62`
- 内容区：`3:395`
  - 左导航：`3:396`，宽 `200`
  - 主内容：`3:1001`，宽 `2360`
- Home Page 主区块（位于 `3:1001`）：
  - Shortcut 标题：`3:1223`
  - Advice 标题：`3:1256`
  - Recently 标题：`3:1264`
  - Shortcut 应用入口组：`3:1231`、`3:1246`
  - Advice 卡片：`3:1258`、`3:1259`
  - Recently 卡片：`14:44`

### 3.3 全局约束吸收

- 技术栈：Next.js App Router + React + Tailwind CSS + Shadcn UI。
- 视觉基线：遵循 IBM Carbon 倾向（0 圆角、1px 边框、主色蓝）。
- 可访问性：按 WCAG 指南实现（键盘可达、焦点可见、错误状态可感知）。
- 安全：前端仅呈现和校验，不暴露敏感信息，不信任客户端权限数据。

## 4. 信息架构与路由设计

```text
Portal (/portal)
├─ PortalLayout
│  ├─ TopHeader
│  │  ├─ BrandLogo
│  │  └─ UserMenu
│  ├─ SideNav
│  │  ├─ Home Nav Item
│  │  └─ Application List Nav Item
│  └─ MainContentOutlet
│     ├─ HomePage (/portal)
│     │  ├─ ShortcutSection
│     │  ├─ AdviceSection
│     │  └─ RecentlySection
│     └─ ApplicationListPage (/portal/applications)
│        ├─ FilterBar
│        └─ ApplicationGrid
```

### 4.1 路由规则

- `/portal`：默认进入 Home Page。
- `/portal/applications`：进入 Application List。
- 未登录访问 `/portal*`：重定向到 `/login`。
- 已登录访问 `/login`：重定向到 `/portal`（与登录页设计一致）。

### 4.2 导航高亮规则

- 依据 pathname 匹配：
  - `/portal` => Home 高亮
  - `/portal/applications` => Applications 高亮
- 高亮状态包含：文字颜色 + 左侧强调条（不能仅靠颜色）。

## 5. 页面结构详细设计

## 5.1 顶部 Header

- 高度：`62px`。
- 左侧：品牌 Logo（点击返回 `/portal`）。
- 右侧：用户菜单（示例文案 `Li, John Gen` + 下拉图标）。
- 样式：白底，底部 `1px` 分割线，顶部细红色强调线（按 Figma）。

交互：
- 用户菜单支持键盘打开（Enter/Space）与 ESC 关闭。
- 菜单项建议至少包含：`Profile`、`Sign out`。

## 5.2 左侧导航 SideNav

- 固定宽：`200px`（桌面）。
- 菜单项：
  - Home Page
  - Applications
- 每项最小高度：`44px`（实现按 50px）。
- 选中态：浅背景 + 右/左 2px 强调边。

交互：
- 点击切换路由。
- `aria-current="page"` 标识当前项。

## 5.3 Home Page

### 5.3.1 Shortcut 区域

- 用途：展示用户常用或有权限访问的快捷应用入口。
- 结构：图标卡片 + 应用名称（最多两行，超出省略）。
- 推荐默认数量：2~8 个。
- 点击行为：进入目标应用（站内路由或外部链接）。

状态：
- loading：显示 skeleton 卡片。
- empty：显示“暂无可用应用”，提供跳转 Application List 入口。

### 5.3.2 Advice 区域

- 用途：展示场景化建议卡片。
- 结构（每卡）：
  - 标题
  - 描述
  - CTA（如 `Prediction Now` / `Analysis Now`）
- 桌面默认 2 列。

状态：
- loading：卡片 skeleton。
- empty：提示“暂无建议”，并提供“浏览所有应用”入口。

### 5.3.3 Recently 区域

- 用途：展示近期用户操作（如预测记录）。
- 单项信息：
  - 标题（如 `London House Prediction`）
  - Location
  - Prediction ID
  - Date
  - CTA（如 `Reopen It`）

状态：
- loading：列表 skeleton。
- empty：`You have no recent activity yet.`。

## 5.4 Application List 页面

> 需求仅定义“展示用户可访问应用列表”，具体布局未在已读取 Figma 节点中展开，以下为可实施默认方案。

- 顶部：页面标题 `Applications` + 结果数量。
- 过滤区：
  - 关键词搜索（按应用名称/描述）
  - 分类筛选（可选）
- 列表区：应用卡片网格（桌面 3 列 / 平板 2 列 / 手机 1 列）。

应用卡片字段：
- 应用图标
- 应用名称
- 简介
- 标签（可选）
- 操作按钮（`Open`）

状态：
- loading：网格 skeleton。
- empty（无权限）：引导联系管理员。
- no-result（筛选无结果）：提示清空筛选。

## 6. 视觉与样式详细设计

### 6.1 设计 Token（建议）

```css
:root {
  --portal-color-bg: #fafbfd;
  --portal-color-surface: #ffffff;
  --portal-color-border: #e2e2e2;
  --portal-color-border-strong: #c9cbda;
  --portal-color-text: #161616;
  --portal-color-text-muted: #858585;
  --portal-color-primary: #0f62fe;
  --portal-color-primary-ink: #0c479d;
  --portal-color-nav-active-bg: #f0f1f7;

  --portal-radius: 0px;
  --portal-border-width: 1px;

  --portal-header-height: 62px;
  --portal-sidenav-width: 200px;
  --portal-content-padding-x: 48px;
  --portal-content-padding-top: 38px;
}
```

### 6.2 样式原则

- 全部核心容器保持 `0` 圆角。
- 卡片/输入框统一 `1px` 描边表达层级，避免重阴影。
- 文本层级：标题黑色、正文灰色、操作蓝色。
- 页面背景轻灰，内容卡白底。

## 7. 交互与状态机设计

### 7.1 页面级状态

- `idle`：初始渲染。
- `loading`：请求首页或应用列表数据。
- `ready`：数据加载成功。
- `error`：数据加载失败（网络/服务错误）。

### 7.2 Home 数据分区状态

- `shortcutState`: loading | empty | ready | error
- `adviceState`: loading | empty | ready | error
- `recentlyState`: loading | empty | ready | error

每个分区可独立失败，不阻断其他分区渲染。

### 7.3 错误反馈

- 区块级错误：区块内展示 retry 按钮。
- 页面级严重错误：顶部 error banner。
- 错误文案避免暴露内部栈信息。

## 8. 数据模型与接口契约（前端视角）

### 8.1 TypeScript 类型建议

```ts
export type PortalApp = {
  id: string;
  key: string;
  name: string;
  description?: string;
  iconUrl?: string;
  category?: string;
  href: string;
  isExternal?: boolean;
  lastUsedAt?: string;
};

export type AdviceItem = {
  id: string;
  title: string;
  content: string;
  actionText: string;
  actionHref: string;
};

export type RecentActivity = {
  id: string;
  title: string;
  location?: string;
  predictionId?: string;
  date?: string;
  reopenHref?: string;
};
```

### 8.2 API 建议（可由 `api-design` 文档细化）

- `GET /api/portal/home`
  - 返回：`shortcuts[]`, `advices[]`, `recentActivities[]`
- `GET /api/portal/applications?keyword=&category=`
  - 返回：`applications[]`, `total`

错误结构建议：

```json
{
  "error": {
    "code": "PORTAL_DATA_FETCH_FAILED",
    "message": "Failed to load portal data"
  }
}
```

## 9. 可访问性设计（WCAG 导向）

- 语义结构：`header`、`nav`、`main`、`section`、`h1~h3`。
- 侧边导航：当前页 `aria-current="page"`。
- 卡片链接：提供可读名称（避免只读图标）。
- 键盘访问：所有操作入口可 Tab 到达；回车/空格可触发按钮。
- 焦点可见：`focus-visible` 至少 2px 明显轮廓。
- 状态播报：异步错误区使用 `role="alert"` 或 `aria-live="polite"`。
- 对比度：正文/背景满足 WCAG 对比度要求。

## 10. 安全与鲁棒性设计

- 权限校验以后端返回为准，前端不缓存高权限配置。
- 外链应用打开时加 `rel="noopener noreferrer"`。
- 不在 URL 暴露敏感上下文（token、内部 ID）。
- API 请求统一错误拦截与重试上限控制（避免无限重试）。
- 应用入口点击前校验 `href` 合法性（空链接不可点击）。

## 11. 响应式设计

### 11.1 断点

- `sm`: `<768px`
- `md`: `768px~1023px`
- `lg`: `>=1024px`

### 11.2 断点行为

- `lg`：侧栏常驻（200px），主区多列布局。
- `md`：侧栏可收缩为图标模式（72px）或抽屉模式。
- `sm`：侧栏改抽屉，默认收起；主区单列卡片。
- Header 右侧用户菜单在小屏保留，仅缩短显示名。

## 12. 前端实现设计（Next.js App Router）

### 12.1 文件规划（建议）

```text
app/
├─ portal/
│  ├─ layout.tsx
│  ├─ page.tsx                      # Home Page
│  └─ applications/
│     └─ page.tsx                   # Application List
├─ components/portal/
│  ├─ portal-header.tsx
│  ├─ portal-sidenav.tsx
│  ├─ shortcut-section.tsx
│  ├─ advice-section.tsx
│  ├─ recently-section.tsx
│  ├─ application-filter-bar.tsx
│  └─ application-grid.tsx
└─ lib/portal/
   ├─ types.ts
   └─ services.ts
```

### 12.2 组件职责

- `layout.tsx`：登录态守卫、Header + SideNav 外壳。
- `portal-sidenav.tsx`：导航渲染与当前路由高亮。
- `page.tsx`：Home 三分区数据聚合。
- `applications/page.tsx`：筛选参数管理、列表请求与展示。
- `services.ts`：封装 portal API 请求与错误归一化。

### 12.3 渲染策略

- Layout 与首屏数据建议使用 Server Component 拉取。
- 过滤器输入可使用 Client Component 管理查询参数。
- 支持 `searchParams` 以便 Application List 可分享筛选 URL。

## 13. 验收标准

- 功能：
  - 登录后可进入 `/portal`。
  - 左侧可在 Home / Applications 间切换。
  - Home 三分区正确渲染并可交互。
  - Application List 可展示用户可访问应用。
- 视觉：
  - Header、SideNav、Home 关键块与 Figma 主节点风格一致。
- 响应式：
  - 375 / 768 / 1280 无错位、遮挡、横向滚动。
- 可访问性：
  - 键盘可达、焦点可见、状态可感知。

## 14. 测试设计

### 14.1 手工测试

- 路由守卫：未登录访问 `/portal` 是否跳转 `/login`。
- 导航切换：Home 与 Applications 高亮与内容是否同步。
- 状态测试：loading/empty/error/retry 是否按区块生效。
- 应用入口：内链/外链打开行为与权限展示是否正确。
- 小屏适配：侧栏抽屉开关与焦点陷阱是否正常。

### 14.2 自动化建议

- Playwright：
  - 登录后进入 portal
  - 左侧导航切换
  - Home 三分区可见性
  - Applications 过滤行为
- 单测（React Testing Library）：
  - 状态组件渲染
  - 错误重试触发
  - `aria-current` 与 `role` 校验

## 15. 风险与待确认项

1. `Application List` Figma 细化节点当前未在 `3:370/3:371` 中明确可读。
   - 建议：补充该子页面节点 ID 后再做像素级微调。
2. Advice/Recently 数据来源与排序规则未定义。
   - 建议：在 API 设计中冻结字段与排序（按最近访问时间降序）。
3. 应用外链打开策略（新开页/同页）未明确。
   - 建议：由产品统一策略，避免体验不一致。
