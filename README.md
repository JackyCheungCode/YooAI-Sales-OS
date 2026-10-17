# YooAI Sales OS

本项目采用 Vite、React、TypeScript、Supabase 和 Vercel 构建。**所有系统 UI 的设计与实现必须严格遵守 IBM Carbon Design System，不得自行建立平行的设计令牌或控件体系。**

## 一、Carbon 官方规范来源

以下链接是本仓库 UI 设计、开发、代码审查和验收的权威参考。遇到规范问题时，以官方文档与当前安装版本的组件 API 为准。

1. **总入口 — Carbon Design System**
   - https://carbondesignsystem.com/

2. **色彩规范 — Color**
   - https://carbondesignsystem.com/building-blocks/foundations/color/overview
   - 后台产品采用 Gray 10 主题：全局背景 #F4F4F4；内容层、容器和组件颜色必须使用对应的 Carbon 主题令牌；交互主色使用官方令牌（Gray 10 主题的交互蓝为 #0F62FE），禁止在业务 CSS 中重复硬编码颜色。

3. **字体与排版 — Typography**
   - https://carbondesignsystem.com/building-blocks/foundations/typography/overview
   - 后台业务系统使用 **Productive** 文字体系，正文基础字号为 14px；所有文字层级优先使用 Carbon 排版令牌。默认西文字体使用 IBM Plex Sans。
   - **中文字体自定义扩展：**在官方 IBM Plex Sans 字体栈之后追加 SimSun（宋体）。这是本项目的本地化扩展，不属于 Carbon 官方默认字体定义；除这项扩展外，不得另建字体规范。

4. **网格布局 — 2x Grid**
   - https://carbondesignsystem.com/building-blocks/foundations/grid/
   - Carbon 2x Grid 官方说明与断点：https://carbondesignsystem.com/building-blocks/foundations/2x-grid/overview
   - 所有页面的列宽、容器、边距、内边距与对齐方式必须遵循 Carbon 2x Grid 原则，并优先使用 Carbon Grid / Column 组件。不得随意创建不符合网格节奏的尺寸。

5. **间距令牌 — Spacing**
   - https://carbondesignsystem.com/building-blocks/foundations/spacing/
   - 布局和组件间距使用官方 Carbon spacing tokens。禁止在页面 CSS 中随意散落固定像素间距；特殊尺寸须有明确的组件或网格依据。

6. **Design Tokens 与主题**
   - https://carbondesignsystem.com/building-blocks/foundations/themes/
   - Carbon 主题和 Design Tokens 是颜色、排版、间距及组件视觉属性的单一数据源。所有页面和组件都应读取 Carbon 官方令牌，不得另建一套颜色、间距、圆角、阴影或控件尺寸变量。

7. **Web Components 组件 Storybook**
   - https://web-components.carbondesignsystem.com/
   - 用于可视化参考和理解组件行为。当前 React 应用优先使用 @carbon/react 的对应 React 组件，不要为了模仿 Storybook 而自行重写控件。

## 二、强制实现规则

- **React 组件：**使用 @carbon/react。
- **图标：**使用 Carbon 官方图标（@carbon/react/icons），不得混用 Lucide、Material、Ant Design 或其他图标库。
- **主题：**默认使用 Carbon g10（Gray 10）主题，背景、卡片层级、边框、交互色由主题令牌提供。
- **唯一令牌来源：**src/styles/carbon.scss 载入 Carbon 官方样式；src/styles/carbon-tokens.css 只负责项目要求的中文宋体字体栈扩展，不定义或覆盖颜色、间距、字号、圆角、阴影和尺寸令牌。
- **统一控件：**按钮、文本框、下拉框、复选框、单选框、标签、搜索、表格、通知、弹窗和导航，必须使用 Carbon 组件或基于 Carbon 组件的薄封装。
- **布局：**优先使用 Carbon Grid / Column 和官方 2x Grid；业务 CSS 只负责页面结构，不得覆盖 Carbon 控件内部样式以制造另一套视觉体系。
- **文字：**后台业务页面使用 Productive 体系和 Carbon 排版令牌；禁止引入营销页面的 Expressive 排版作为后台默认。
- **新增页面验收：**检查主题、颜色、字体、间距、2x Grid、响应式、键盘操作、焦点可见性和 Carbon 组件使用情况。
- 如果 Carbon 已有对应组件，不允许自制替代品。只有 Carbon 未提供的业务专属组合才允许自定义，并且必须遵守 Carbon 无障碍模式和设计令牌。

## 三、代码位置

- Carbon 官方样式入口：src/styles/carbon.scss
- 唯一允许的字体栈扩展：src/styles/carbon-tokens.css
- 应用入口与全局主题：src/main.tsx
- 可复用业务封装：src/components/ui/
- 页面与布局：src/modules/、src/layouts/
- 详细设计系统策略：docs/architecture/DESIGN-SYSTEM.md

## 四、本地开发

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

补充导航类cds组件
 
UI‑Shell是Carbon整套全局导航框架，全部是 <cds‑xxx> web‑component，不要手写div做侧边栏、顶部栏、汉堡菜单 。
 
35. 全局顶部外壳header： <cds-header> ，整个页面最顶部通栏；搭配 <cds-header-name> 产品名称、 <cds-header-global-action> 右上角全局操作按钮（退出登录、个人中心）。
36. 汉堡菜单按钮： <cds-hamburger> ，用来打开/关闭左侧侧边导航栏。
37. 侧边导航容器： <cds-side-nav> ，左侧固定侧边栏；不要手写div做侧边栏。
38. 侧边导航分组菜单： <cds-side-nav-menu> ，侧边栏可折叠分组菜单（例如“经营工作空间”分组）。
39. 侧边导航菜单项： <cds-side-nav-menu-item> ，侧边栏每一条导航链接，支持设置 aria‑current="page" 标记当前激活页面。
40. 侧边导航分隔线： <cds-side-nav-divider> ，侧边栏菜单之间分割，不要手写border。
41. 右侧滑出面板： <cds-side-panel> ，header触发从右侧滑出的面板。
42，4. 输入搜索框：全部使用  <cds-input> ，页面所有普通文本输入、搜索框。搜索场景，搭配 <cds-icon slot="prefix"> 放在输入框前缀作为搜索放大镜图标；支持清除按钮属性。禁止div手写模拟搜索框。
 
注意：之前已经写过的导航相关组件：
 
13. -  <cds‑breadcrumb> 面包屑导航（页面路径：经营工作空间 / 经营智控中枢）
18. -  <cds‑tabs> + <cds‑tab> 页面内选项卡导航（管理层总览、销售绩效这类页面内部tab）
 
导航的强制约束（加到prompt）
 
全局导航全部使用cds UI‑Shell原生组件： <cds-header> 、 <cds‑hamburger> 、 <cds‑side‑nav> 系列。
禁止手写div实现顶部通栏、侧边栏、汉堡菜单、侧边折叠菜单；不要手写div做侧边栏的展开收起逻辑。
当前激活页面，菜单项设置原生属性 aria‑current="page" ，不要自己写高亮背景色。
 
 
 
📋完整全部cds控件清单
 
1. 卡片容器：全部使用  <cds-card> ，KPI指标卡片、详情面板、图表容器、弹窗内部卡片都要用。禁止div模拟卡片。
2. 按钮：全部使用  <cds-button> ，区分 primary / secondary / ghost 三种类型。新建、刷新、导出、保存等操作按钮统一使用。
3. 数据表格：全部使用  <cds-table> ，客户列表、订单列表、收汇记录列表。行选中效果使用组件原生选中样式，禁止自定义蓝色选中背景。
4. 输入搜索框：全部使用  <cds-input> ，页面所有普通文本输入控件。
5. 数字输入框：全部使用  <cds-number-input> ，金额、数量等数字录入场景。
6. 下拉选择器：全部使用  <cds-select> ，搭配  <cds-select-item> 。禁止手写div弹窗、radio模拟下拉浮层，弹出面板使用cds自带popover。
7. 下拉多选组件：全部使用  <cds-multi-select> ，搭配  <cds-multi-select-item> ，多选下拉场景。
8. 复合下拉（可输入+选择）：全部使用  <cds-combo-box> ，搭配  <cds-combo-box-item> ，支持搜索筛选的下拉。
9. 溢出菜单（三点更多菜单）：全部使用  <cds-overflow-menu> ，搭配  <cds-overflow-menu-item> ，表格行更多操作、卡片右上角三点菜单。
10. 状态标签：全部使用  <cds-tag> ，客户等级、订单状态、业务标记、右上角状态提示标签，禁止自定义色块气泡。
11. 空状态：全部使用  <cds-empty-state> ，列表无数据、仪表盘暂无统计数据场景。
12. 文字链接：全部使用  <cds-link> ，查看明细这类跳转链接。
13. 面包屑导航：全部使用  <cds-breadcrumb> ，页面顶部面包屑，不要手动写斜杠 / 分隔文字。
14. 告警提示条：全部使用  <cds-alert> ，风险、通知、警告提示。
15. 图标：全部使用  <cds-icon> ，页面所有图标，不再引入外部svg图标。
16. 单选组件：全部使用  <cds-radio-group>  +  <cds-radio> ，单选选项场景。
17. 复选组件：全部使用  <cds-checkbox> ，多选勾选场景。
18. 选项卡标签页：全部使用  <cds-tabs>  +  <cds-tab> ，页面tab切换区域。
19. 模态弹窗：全部使用  <cds-modal> ，大弹窗、确认弹窗，禁止手写div遮罩弹窗。
20. 分页控件：全部使用  <cds-pagination> ，列表底部分页，切换页码、每页条数。
21. 日期选择器：全部使用  <cds-date-picker> ，选择日期、日期区间场景。
22. 文件上传组件：全部使用  <cds-file-uploader> ，上传水单、附件场景。
23. 折叠面板：全部使用  <cds-accordion>  +  <cds-accordion-item> ，可折叠详情区块。
24. 复制按钮：全部使用  <cds-copy-button> ，一键复制文本功能。
25. 加载动画：全部使用  <cds-loading> ，全局加载、区块加载；行内小加载  <cds-inline-loading> 。
26. 进度指示器：全部使用  <cds-progress-indicator> ，业务多步骤流程展示。
27. 开关组件：全部使用  <cds-toggle> ，开启/关闭配置项。
28. 提示气泡tooltip：全部使用  <cds-tooltip> ，鼠标悬浮提示文字，禁止手写悬浮div。
29. 代码片段：全部使用  <cds-code-snippet> ，展示API、代码文本。
30. 内容切换器：全部使用  <cds-content-switcher> ，同区域切换不同视图。
31. 结构化列表：全部使用  <cds-list> ，静态信息列表展示。
32. 分隔线：全部使用  <cds-divider> ，区块分割，不要手写border模拟分割线。
33. 骨架屏：全部使用  <cds-skeleton-text> 、 <cds-skeleton-placeholder> ，数据加载前占位。
34. 图表：cds组件库没有cds图表标签。图表采用Carbon官方配套的 @carbon/charts 库实现。图表渲染画布本身不用cds标签，但是图表整体外层容器必须包裹在 <cds-card> 内。图表配色、坐标轴、图例使用Carbon内置主题，禁止自定义线条/填充色；图表标题、图例文字严格遵守全站文字token规范。
35. 全局顶部外壳header： <cds-header> ，整个页面最顶部通栏；搭配 <cds-header-name> 产品名称、 <cds-header-global-action> 右上角全局操作按钮（退出登录、个人中心）。
36. 汉堡菜单按钮： <cds-hamburger> ，用来打开/关闭左侧侧边导航栏。
37. 侧边导航容器： <cds-side-nav> ，左侧固定侧边栏；不要手写div做侧边栏。
38. 侧边导航分组菜单： <cds-side-nav-menu> ，侧边栏可折叠分组菜单。
39. 侧边导航菜单项： <cds-side-nav-menu-item> ，侧边栏每一条导航链接，使用 aria‑current="page" 标记当前激活页面。
40. 侧边导航分隔线： <cds-side-nav-divider> ，侧边栏菜单之间分割，不要手写border。
41. 右侧滑出面板： <cds-side-panel> ，header触发从右侧滑出的面板。
42，cds-modal：创建新建记录（新建商机、新建客户、新建出运单）
cds-side-panel：查看记录详情、多字段编辑查看
cds-modal：新建创建记录（短表单创建弹窗）
cds-side-panel：查看记录详情、详情页编辑记录
 
 
全局强制约束
 
只要Carbon Web Components存在对应的cds组件，必须使用上面列出的原生cds标签实现。
禁止用普通div、span模拟卡片、按钮、tag、表格、下拉、输入框；禁止手写色块、自定义背景块模拟组件外观。
严禁修改cds组件内部shadow dom样式，仅通过组件自带属性控制外观。
全局导航全部使用cds UI‑Shell原生组件，禁止手写div实现顶部通栏、侧边栏、汉堡菜单、侧边折叠菜单；不要手写div做侧边栏展开收起逻辑；当前激活页面菜单项设置 aria‑current="page" ，不要自己写高亮背景色。
 
文字排版全局规则（接在后面）
 
禁止手写固定px字号、行高、margin、padding，全部引用Carbon Design System CSS Token。
全局字体定义：英文、数字 IBM Plex Sans；中文宋体。
文字层级（全站固定5级，不可新增自定义字号）
 
1. PageHeader页面主标题：var(--cds-type-heading-01)
2. 模块区块标题（客户档案、月度收入趋势）：var(--cds-type-heading-02)
3. KPI卡片核心大数值：var(--cds-type-expressive-heading-03) （放大突出金额/百分比）
4. 正文、表格行文字、字段名称：var(--cds-type-body-01)
5. 辅助小字、环比说明、备注提示：var(--cds-type-body-02)（弱化显示）
 
文字颜色，仅使用Carbon内置语义变量，禁止自定义#十六进制色值：
主文本：var(--cds-text-primary)
次要辅助文本：var(--cds-text-secondary)
上涨/成功文本：var(--cds-text-success)
预警文本：var(--cds-text-warning)
风险/错误文本：var(--cds-text-danger)
 
行高跟随type token自带配置，不手动修改line-height。
采用Carbon 2x栅格系统，基础单位8px。
所有外边距、内边距，全部使用carbon spacing token，禁止硬编码px。
 
- 卡片内部内边距：var(--cds-spacing-05)
- 卡片与卡片之间间距：var(--cds-spacing-06)
 
对齐规范（全站统一）
 
1. 卡片内部标题、图标：顶部左对齐
2. KPI大数字：左对齐
3. cds-table表格：普通文本左对齐；金额、数字类数据右对齐
4. 按钮、链接默认左对齐，禁止随意居中
 
响应式布局规则
桌面端：仪表盘KPI卡片2列横向排布；
平板/手机窄屏：卡片自动变为单列流式排布，保证移动端可读性。
 
禁止行为：随意居中文字、自定义字重、手动修改字间距、自定义圆角。
 
