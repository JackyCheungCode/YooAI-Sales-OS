# Project Structure

## Principles

- **Feature modularity:** business domains live under `src/modules/` and own their pages, schemas, services, and tests.
- **Reusable design system:** generic controls live under `src/components/ui/`; visual tokens live under `src/styles/tokens/` and themes under `src/styles/themes/`.
- **One source of truth:** avoid duplicating colors, typography, spacing, radii, shadows, and control states in individual pages.
- **Separation of concerns:** routes compose features; shared infrastructure lives in `src/lib/`; layouts are independent of business data.
- **Responsive and accessible by default:** controls should define focus, disabled, loading, error, keyboard, and responsive behavior.

## Planned structure

```text
src/
  app/                 # bootstrap and providers
  assets/              # shared assets
  components/ui/       # reusable controls by category
    buttons/
    fields/
    selection/
    overlays/
    data-display/
    feedback/
  layouts/             # application shells and page layouts
  lib/                 # API, validation, utilities, error handling
  modules/             # business feature modules
    customers/
    companies/
    contacts/
    leads/
    activities/
    settings/
  routes/              # route definitions and composition
  styles/
    tokens/            # design tokens
    themes/            # theme mappings
```

This commit establishes the directory scaffold only. Framework, dependencies, authentication, persistence, and business functionality will be selected and implemented in later steps.