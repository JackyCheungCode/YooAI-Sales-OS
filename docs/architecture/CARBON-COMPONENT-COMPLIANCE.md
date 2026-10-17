# Carbon Web Components 全站整改与后续开发补充规范

本文件是 `docs/architecture/DESIGN-SYSTEM.md` 的强制补充，适用于所有已登记路由、公共布局、通用控件、弹窗、表单、图表、样式文件及后续新增页面。与旧实现冲突时，以产品负责人本次明确要求为准；组件 API 则必须与仓库实际安装版本和官方文档一致。

## 1. 执行原则

1. 对于当前安装的 Carbon Web Components 版本确实提供的对应控件，必须使用原生 `cds-*` Web Component，不得使用普通 HTML/React 元素模拟同类控件的外观或交互。
2. 不得仅为匹配标签名而盲目替换。迁移必须保留业务逻辑、路由、状态管理、表单校验、键盘交互、无障碍属性和数据读写。
3. 不得修改 Carbon 组件 Shadow DOM 内部样式。只能使用公开属性、插槽、事件、主题和 Carbon CSS design tokens。
4. 业务容器可使用语义化布局元素、CSS Grid/Flex 和 Carbon Grid；但不得用它们模拟 Carbon 卡片、按钮、表格、输入、标签、弹窗、导航或分隔线。
5. 当前依赖为 `@carbon/web-components@2.64.0`。开始迁移前，先核对组件在此版本是否真实存在、正式标签名、子组件、属性及事件。若负责人列出的名称在此版本不存在或实际语义不同，必须使用官方等价组件并在审计记录中注明，不得注册无实现的自定义标签来伪装合规。
6. 任何整改完成后必须运行 `npm run typecheck`、`npm run build`，并验证登录、路由刷新、核心表单和页面交互。没有实际运行成功的检查不得标记为通过。未经明确授权不得部署 Preview 或生产。

## 2. 全站组件映射清单

| 使用场景 | 强制目标 |
|---|---|
| 卡片、KPI、详情区、图表外框、弹窗内卡片 | 本项目 `@carbon/web-components@2.64.0` 现有封装使用官方 `cds-tile`（`Tile`）；先核验包内是否存在 `cds-card`，若不存在，不得注册空标签，统一使用 `cds-tile` 并记录 API 差异 |
| 操作按钮 | `cds-button`，按语义使用 primary、secondary、ghost；危险操作按官方支持的危险语义处理 |
| 数据表格 | `cds-table` 及官方表头、行、单元格子组件；不得用 div/grid 模拟数据表 |
| 普通文本输入 | 当前代码使用官方 `cds-text-input`；Carbon Web Components 版本若未提供 `cds-input`，以 `cds-text-input` 作为正式等价组件 |
| 搜索输入 | Carbon 官方搜索组件；带搜索图标前缀和清除能力，优先使用原生属性/插槽，不得用 div 画搜索框 |
| 数字输入 | `cds-number-input` 或当前版本正式等价组件 |
| 单选下拉 | `cds-select` + 官方 select item 子组件 |
| 多选下拉 | `cds-multi-select` + 官方多选 item 子组件 |
| 可输入筛选下拉 | `cds-combo-box` + 官方 item 子组件 |
| 更多菜单 | `cds-overflow-menu` + 官方菜单项子组件 |
| 状态标签 | `cds-tag` |
| 空状态 | `cds-empty-state`（仅当当前版本确实提供）；否则用可访问的语义化空状态内容并登记例外 |
| 文本链接 | `cds-link` 或当前版本官方链接组件 |
| 面包屑 | `cds-breadcrumb` 及官方子项；禁止用斜杠文本代替 |
| 告警/通知 | `cds-alert` 或当前版本官方 notification 组件 |
| 图标 | 使用 Carbon 官方图标体系/组件插槽；禁止手写 SVG、外部图标库或混用另一套图标系统 |
| 单选组 | `cds-radio-group` + `cds-radio`；按当前版本正式组件 API 核对 |
| 复选框 | `cds-checkbox` |
| 页面内标签页 | `cds-tabs` + `cds-tab` |
| 模态弹窗 | `cds-modal` 及官方子组件；禁止手写遮罩层模拟 |
| 分页 | `cds-pagination` 或当前版本正式等价分页组件 |
| 日期选择 | `cds-date-picker` 或当前版本正式日期选择组件 |
| 文件上传 | `cds-file-uploader` 及官方子组件 |
| 折叠面板 | `cds-accordion` + `cds-accordion-item` |
| 一键复制 | `cds-copy-button` |
| 加载 | `cds-loading`；行内加载 `cds-inline-loading` |
| 多步骤流程 | `cds-progress-indicator` 及官方步骤子组件 |
| 开关 | `cds-toggle` |
| 悬浮提示 | `cds-tooltip` 或当前版本官方 tooltip 模式 |
| 代码片段 | `cds-code-snippet` |
| 同区域视图切换 | `cds-content-switcher` |
| 结构化列表 | `cds-list` 或当前版本官方列表模式 |
| 分隔线 | `cds-divider` 或当前版本官方分隔线组件 |
| 骨架屏 | `cds-skeleton-text`、`cds-skeleton-placeholder` 或当前版本官方 skeleton 组件 |
| 图表 | Carbon 官方 `@carbon/charts`；图表整体外层必须放在 Carbon 卡片/官方容器中，使用 Carbon 内置主题、坐标轴和图例样式 |

> 上表是迁移目标，不代表每个标签名都一定存在于已安装的 2.64.0 版本。实施前必须查证版本 API；不得将不存在的标签直接当作已工作的组件。

## 3. 全局 UI Shell 导航强制规则

全局导航必须使用 Carbon UI Shell 原生 Web Components，不得用 div、aside、nav 或自定义按钮模拟其外观和展开/收起行为。

- 顶部通栏：`cds-header`。
- 产品名称：`cds-header-name`。
- 顶部全局操作：`cds-header-global-action`，例如个人中心、退出登录。
- 菜单开关：当前代码使用 Carbon UI Shell 的 `cds-header-menu-button`。只有在安装版本正式导出 `cds-hamburger` 时才可使用该标签；不得创建虚假标签。
- 左侧导航容器：`cds-side-nav`。
- 可折叠分组：`cds-side-nav-menu`。
- 导航项：`cds-side-nav-menu-item`；主导航和分组子项均需使用当前版本支持的 UI Shell 原生导航项，并为当前页设置 `aria-current="page"`。
- 导航分隔：`cds-side-nav-divider`（若当前版本没有独立标签，使用官方 UI Shell 分隔模式并记录）。
- 右侧滑出面板：当前 UI Shell 通过 `cds-header-global-action` 的 `panel-id` 触发 `cds-header-panel`；不创建不存在的 `cds-side-panel` 标签，也不手写遮罩或滑出动画。
- 面包屑：`cds-breadcrumb`，禁止手写“经营工作空间 / 页面名称”作为替代导航组件。
- 页面内选项卡：`cds-tabs` + `cds-tab`。
- 当前页面菜单项必须设置原生 `aria-current="page"`；不得仅通过自定义背景色模拟激活状态。
- 负责人指定的 `cds-card`、`cds-input`、`cds-hamburger` 等名称必须先与 `@carbon/web-components@2.64.0` 的实际导出核对；标签名称相似不等于组件存在。当前代码的已知等价映射为 `cds-tile`、`cds-text-input`、`cds-header-menu-button`。
- 展开/收起和移动端导航状态必须由 UI Shell 组件的公开 API/事件驱动，禁止另写 div 侧栏开关逻辑。
- 必须验证桌面、平板、手机、键盘焦点、当前页状态、路由跳转、浏览器刷新和退出登录。

## 4. 字体与文字层级

全站字体栈：英文和数字使用 IBM Plex Sans；中文使用宋体（SimSun）。在全局统一定义，不得按页面另建字体规则。

全站只允许以下五级文字层级，不得新增自定义字号：

1. 页面主标题 PageHeader：`var(--cds-type-heading-01)`
2. 模块/区块标题：`var(--cds-type-heading-02)`
3. KPI 核心数字：`var(--cds-type-expressive-heading-03)`
4. 正文、表格行、字段名称：`var(--cds-type-body-01)`
5. 辅助文字、环比说明、备注：`var(--cds-type-body-02)`

- 禁止固定 px 字号及手动设置 `line-height`；行高跟随 Carbon typography token。
- 禁止随意新增字重、字间距、圆角及页面专属字号。
- 颜色仅使用 Carbon 语义 token：主文本 `var(--cds-text-primary)`、辅助文本 `var(--cds-text-secondary)`、成功 `var(--cds-text-success)`、预警 `var(--cds-text-warning)`、风险 `var(--cds-text-danger)`。不得在业务样式中写十六进制色值或自建颜色体系。
- 字体/颜色 token 若与已安装 Carbon 版本的实际 token 名不一致，应核对版本并使用官方有效 token，不得留下无效 CSS 变量。

## 5. 网格、间距与对齐

- 使用 Carbon 2x Grid，基础节奏为 8px。
- 普通 margin、padding、gap 必须使用 Carbon spacing token；禁止硬编码 px。
- 卡片内边距使用 `var(--cds-spacing-05)`；卡片间距使用 `var(--cds-spacing-06)`。
- 卡片标题与图标顶部左对齐；KPI 数值左对齐。
- 表格普通文本左对齐；金额及数值类列右对齐。
- 按钮、链接默认左对齐，禁止无设计依据地居中。
- 桌面端仪表盘 KPI 卡片按两列横向排布；平板和手机窄屏自动变为单列流式布局，不能横向溢出或遮挡操作。

## 6. 图表规范

- 图表使用 Carbon 官方 `@carbon/charts`。
- 图表画布可由图表库渲染，但整个图表区必须处于 Carbon 卡片/官方容器内。
- 使用 Carbon 内置主题和配色；禁止自定义线条色、填充色、坐标轴色及图例色。
- 标题、轴标签、图例、提示文字严格使用上述五级文字层级与 Carbon 语义颜色 token。

## 7. 页面及公共组件审计范围

每次全站审计必须覆盖所有路由页面及以下公共区域，不能只抽查首页：

- 路由入口、认证与错误边界；
- 顶部导航、侧边导航、面包屑、标签页；
- 所有页面内的表单、筛选器、输入、选择、复选、日期、上传；
- 所有数据表格、分页、空状态、加载状态、告警、tooltip、确认弹窗；
- 所有 KPI/详情/图表容器、标签、图标、链接及复制操作；
- 全局 CSS、页面 CSS、Carbon token 文件、组件注册和兼容封装；
- 桌面、平板、手机响应式，以及键盘操作、焦点、标签关联和 ARIA 语义。

## 8. PR/合并前强制验收

- [ ] 所有路由与公共组件均已纳入审计，无遗漏页面。
- [ ] 所有适用的原生 Carbon 控件已迁移；例外必须逐项记录原因。
- [ ] UI Shell 原生导航已使用，当前页面设置 `aria-current="page"`。
- [ ] 没有 div/span 模拟 Carbon 控件，也没有自制弹窗、搜索框、分隔线或状态色块。
- [ ] 没有 Shadow DOM 内部样式覆盖。
- [ ] 字体、字号、语义颜色、spacing token、对齐与响应式符合本文。
- [ ] 已运行 `npm run typecheck` 和 `npm run build` 并记录真实结果。
- [ ] 已完成登录、页面刷新、路由跳转、表单、数据表格、弹窗和移动端回归。
- [ ] 未经明确授权不部署 Preview 或生产环境。

未执行的检查必须标记为“未验证”，不得宣称全站通过。


## 8. 弹窗与详情侧面板强制规范

- 创建业务记录（例如客户、联系人、线索、商机、订单、报价、收汇、出运单）必须使用已安装版本支持的 Carbon 原生 `cds-modal` 及其官方子组件；禁止用自定义遮罩、`role="dialog"` 的 section/div 或手写弹窗模拟。
- 查看单条记录详情、编辑既有记录详情必须使用官方 `cds-side-panel` 及其官方子组件。实施前必须核验 `@carbon/web-components@2.64.0` 是否包含该组件和对应 footer 子组件；若组件 API 不存在或不兼容，必须记录阻塞并先核验官方等价方案，不得创建空标签或用自定义 div 冒充。
- 弹窗操作按钮必须放在原生 `cds-modal-footer` 轨道内；详情侧面板操作按钮必须放在原生 `cds-side-panel-footer` 轨道内。Footer 应使用当前版本支持的官方 footer 组件/按钮子组件，不得用普通 `footer`、自定义 `div` 或自定义类名容器替代。
- 通用封装必须明确暴露 Modal、Modal Footer、Side Panel、Side Panel Footer 的原生组件映射，并统一处理关闭事件、焦点管理、键盘操作和可访问性属性。
- 全站审计须检索所有页面、共用组件、样式文件中的 `cds-modal`、`cds-side-panel`、`role="dialog"`、`modal-backdrop`、`<footer>`、`modal-footer`、`side-panel-footer` 等引用，逐项判断用途并记录迁移结果。
- 新建记录表单使用 Modal；查看/编辑现有记录使用 Side Panel；与记录详情无关的轻量确认、风险提示等对话框可继续使用 Modal，但必须使用原生 Carbon footer。
- 未完成真实版本 API 核验、代码构建和交互回归前，不得标记为通过或部署。

## 9. PR/合并前强制验收（弹窗与侧面板补充）

- [ ] 创建记录均使用原生 `cds-modal`，无自制遮罩层或 `role="dialog"` 模拟实现。
- [ ] 查看/编辑现有记录详情均使用官方 `cds-side-panel`，或有经过负责人确认并记录的官方等价方案。
- [ ] 所有 Modal 操作按钮均位于原生 `cds-modal-footer`；所有 Side Panel 操作按钮均位于原生 `cds-side-panel-footer`。
- [ ] 全站无用普通 `footer` 或自定义 `div` 充当弹窗/侧面板操作轨道的实现。
- [ ] 已验证关闭按钮、遮罩关闭、Escape、焦点陷阱/还原、键盘操作、移动端布局及表单提交行为。


### 实施进度（2026-10-17）

- 已将 `@carbon/web-components` 从 `2.64.0` 更新到稳定补丁版本 `2.65.0`。该版本升级本身不代表 `cds-side-panel` 已进入公开稳定 API；实施侧面板前仍须核验发布包导出与注册文件。
- 已在共用 Carbon 兼容层增加原生 `cds-modal-footer` 映射，并将“新建真实订单”从自制遮罩/section 对话框迁移为原生 `cds-modal` 结构。
- 全站其他弹窗 Footer 迁移、详情查看/编辑 Side Panel 迁移、类型检查、构建及交互回归仍未完成；不得标记为全站通过。
