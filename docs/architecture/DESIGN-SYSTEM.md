# Carbon Design System 强制规范

本项目所有后台页面、系统控件和交互设计必须严格遵守 IBM Carbon Design System。此文档与根目录 README.md 共同构成项目设计验收标准。

## 1. 官方规范来源

- Carbon 总入口：https://carbondesignsystem.com/
- 色彩：https://carbondesignsystem.com/building-blocks/foundations/color/overview
- 字体与排版：https://carbondesignsystem.com/building-blocks/foundations/typography/overview
- 2x Grid 网格：https://carbondesignsystem.com/building-blocks/foundations/grid/
- 间距：https://carbondesignsystem.com/building-blocks/foundations/spacing/
- Design Tokens 与主题：https://carbondesignsystem.com/building-blocks/foundations/themes/
- Web Components Storybook：https://web-components.carbondesignsystem.com/
- Carbon React 组件文档：https://www.carbondesignsystem.com/getting-started/developing/carbon-core/react

## 2. 主题与颜色

- 后台默认主题必须为 Carbon Gray 10（g10）。通过 `GlobalTheme theme="g10"` 应用官方主题，不得自行仿制主题色板。
- 页面背景由 Carbon 背景令牌提供，Gray 10 对应 `#F4F4F4`。
- 卡片和容器使用 Carbon layer 令牌，不得自行硬编码白色背景。
- 主交互色使用 Carbon 官方交互令牌；Gray 10 主题对应蓝色为 `#0F62FE`。业务样式应引用令牌而不是直接写十六进制颜色。
- 任何新颜色都必须先确认 Carbon 是否已有语义令牌，不得创建平行调色板。

## 3. 字体与排版

- 后台 B 端产品统一采用 Carbon Productive 文字体系，不使用 Expressive 作为后台默认排版。
- 正文基础字号采用官方 `body-compact-01` / `body-01` 等 Productive 令牌（基础字号 14px）；标题、辅助文字和行高使用对应的 Carbon 排版令牌。
- 英文字体使用 IBM Plex Sans。
- 唯一允许的项目字体扩展是在字体栈中追加中文宋体 `SimSun`。该项是项目本地化扩展，不属于 Carbon 官方默认定义。
- `src/styles/carbon-tokens.css` 只能设置这一项字体栈扩展，不得定义颜色、字号、间距、圆角、阴影或尺寸变量。

## 4. 2x Grid 与间距

- 页面容器、列宽、边距、内边距和响应式布局必须遵循 Carbon 2x Grid 的网格节奏。
- 优先采用 Carbon React 的 `Grid`、`Column` 等官方布局组件；自定义页面布局必须遵守同样的 2x Grid 规则。
- 间距必须使用 Carbon 官方 spacing tokens（例如 `--cds-spacing-03`、`--cds-spacing-05`、`--cds-spacing-07`）。不得随意散落固定像素间距。
- 固定像素只允许用于有明确依据的边框、图标尺寸、断点或组件固有尺寸；普通 margin、padding、gap 应使用间距令牌。

## 5. 组件与图标

- 系统控件统一使用 `@carbon/react`；图标统一使用 `@carbon/react/icons`。
- 按钮、输入框、下拉框、复选框、单选框、搜索、标签、表格、通知、弹窗和导航等，优先直接使用 Carbon 官方组件。
- `src/components/ui/` 只允许存在薄封装：用于统一业务语义、默认值和项目接口；内部必须调用 Carbon 组件，不得重写其视觉或交互。
- 禁止引入 Lucide、Material UI、Ant Design、Bootstrap 或其他并行组件/图标库。
- 自定义 CSS 仅负责业务页面结构；不得通过覆盖 Carbon 控件内部选择器建立另一套组件样式。

## 6. 代码入口

- `src/styles/carbon.scss`：Carbon 官方样式入口。
- `src/styles/carbon-tokens.css`：唯一允许的 SimSun 字体栈扩展。
- `src/main.tsx`：应用全局 `g10` 主题入口。
- `src/components/ui/`：Carbon 业务薄封装。
- `src/layouts/` 与 `src/modules/`：应用布局和业务页面。

## 7. 新增页面与合并前检查

每次新增或修改页面，必须检查：

1. 是否应用 Carbon g10 主题。
2. 是否只使用 Carbon 语义颜色和官方设计令牌。
3. 是否使用 Productive 排版和 IBM Plex Sans + SimSun 字体栈。
4. 容器、边距、列宽是否符合 2x Grid。
5. 是否用 Carbon spacing tokens 管理普通间距。
6. 系统控件和图标是否来自 Carbon。
7. 键盘操作、可见焦点、标签关联、响应式与无障碍是否合格。
8. 是否引入重复的自定义颜色、间距、字体、圆角、阴影或控件规范。

若 Carbon 已提供对应组件，不允许自制替代。只有 Carbon 未提供的业务专属组合才允许自定义，且必须继续遵守 Carbon 的无障碍模式与令牌体系。

## 8. 验证状态

本仓库已接入 Carbon React、g10 主题和 SimSun 字体栈扩展，并开始替换现有控件。必须在本地依次运行 `npm install`、`npm run typecheck`、`npm run build`，再进行浏览器视觉和交互回归；在这些检查实际通过之前，不得宣称完整迁移已验收。
