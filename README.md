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

在本地 .env.local 或部署环境中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_PUBLISHABLE_KEY。**严禁将 Supabase service-role 或 secret key 放入任何 VITE_ 前端环境变量。**

## 五、当前实现状态

- Carbon 组件已开始用于共享控件、应用导航、登录页面和客户管理页面。
- 本次设计规范要求已纳入仓库文档；仍需继续逐页审查和调整旧布局样式。
- Supabase 数据库迁移目前只是草稿，尚未应用到真实项目。
- 客户 CRUD 尚未完成数据库接入。
- GitHub Actions 已添加构建检查工作流，但在取得实际成功结果前，不宣称构建验证通过。
- 本次没有手动触发 Vercel Preview 或 Production 部署。
