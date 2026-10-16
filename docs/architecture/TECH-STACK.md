# Application Stack and Security Boundaries

## Runtime
- Frontend: Vite, React, TypeScript, React Router.
- System UI and design language: IBM Carbon Design System via `@carbon/react`; Carbon icons via `@carbon/react/icons`; official Carbon Sass theme and tokens.
- Data and identity: Supabase PostgreSQL and Supabase Auth.
- Hosting: Vercel static hosting with SPA fallback in `vercel.json`.
- Source of truth: GitHub `main` branch.

## UI policy
- Carbon is mandatory for system components, including buttons, text inputs, selects, text areas, checkboxes, radio groups, tags, dialogs, notifications, and tables.
- Do not introduce another component or icon library or build parallel custom controls.
- Shared components under `src/components/ui` are thin wrappers over Carbon components.
- See `docs/architecture/DESIGN-SYSTEM.md` for the enforcement rules.
- `src/styles/tokens.css` is a documentation marker only; Carbon itself is the sole source of design tokens.

## Frontend environment variables
- `VITE_SUPABASE_URL`: Supabase project URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: browser-safe publishable key.

Never put a Supabase service-role or secret key in a `VITE_` variable. Browser code is public to every visitor.

## Database migration
`supabase/migrations/20261016190000_initial_crm_schema.sql` is a reviewed starting draft for companies, customers, contacts, leads, activities, indexes, timestamps, and owner-scoped RLS. It has not been applied to a Supabase project. Review and test it in a non-production project before applying.

## Current boundaries
- Email/password login is wired to Supabase Auth; public registration is not exposed.
- Customer data loading and CRUD are not yet connected to the UI.
- RLS policies in the migration are owner-scoped; a future team/workspace model will require a deliberate membership-based authorization design.
- Carbon integration files have been updated in GitHub, but a clean install, TypeScript check, production build, and browser regression test are still required before calling the migration verified.
- No manual Preview or Production deployment has been requested or performed as part of this change.
