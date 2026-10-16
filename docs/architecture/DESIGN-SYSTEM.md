# UI Design System Policy

## Mandatory standard

Global Prospect uses IBM Carbon Design System as its sole system UI component and design-token source.

- React components: `@carbon/react`
- Icons: Carbon icons exposed by `@carbon/react/icons`
- Styling and theme: `@use '@carbon/react';` through `src/styles/carbon.scss`
- Design tokens: official Carbon theme tokens. `src/styles/tokens.css` is retained as a documentation marker only and must not define an independent palette, spacing scale, typography scale, radius system, or shadow system.
- Shared wrappers in `src/components/ui` may add business semantics/defaults but must render Carbon components internally.
- Do not add Lucide, Material UI, Ant Design, Bootstrap controls, hand-built form controls, or bespoke button/input/tag styles.
- For a missing Carbon component, first check Carbon's official component catalog. A custom component is allowed only for product-specific composition that Carbon does not provide, and it must use Carbon tokens and accessibility patterns.
- Keep layout-specific CSS separate from component styling. Do not override Carbon component internals to create a parallel design system.

## Required references

- Carbon source: https://github.com/carbon-design-system/carbon
- React package guide: https://www.carbondesignsystem.com/getting-started/developing/carbon-core/react
- Component documentation and Storybook are the source of truth for component APIs.

## Adoption status

The shared button, text input, select, text area, tag, checkbox and radio wrappers target Carbon components. The customer page now uses Carbon Search, Tag and Tile; the application shell uses Carbon SideNavLink, SideNavItems, Carbon icons and Carbon buttons. Layout CSS remains only for page composition and uses Carbon theme tokens. A full visual and accessibility review is still required. A local install, TypeScript check, build, and browser regression test must be completed before considering adoption verified.
