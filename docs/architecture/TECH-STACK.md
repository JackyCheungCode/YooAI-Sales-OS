# Application Stack and Security Boundaries

## Runtime
- Frontend: Vite, React, TypeScript, React Router.
- Data and identity: Supabase PostgreSQL and Supabase Auth.
- Hosting: Vercel static hosting with SPA fallback in `vercel.json`.
- Source of truth: GitHub `main` branch.

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
- No Preview or Production deployment is triggered by this scaffold work.
