# YooAI Sales OS

Modular customer-management workspace built with Vite, React, TypeScript, Supabase and Vercel.

## Mandatory UI system

This project strictly uses [IBM Carbon Design System](https://github.com/carbon-design-system/carbon) for system UI components, icons, themes and design tokens.

- React components: `@carbon/react`
- Carbon icons: `@carbon/react/icons`
- Theme and styles: `src/styles/carbon.scss`
- Shared business wrappers: `src/components/ui`
- Rules and adoption notes: [Design System Policy](docs/architecture/DESIGN-SYSTEM.md)

Do not add other UI component libraries or icon libraries, and do not build parallel button, input, select, checkbox, radio, tag, navigation, or search controls. Use Carbon components directly or through the shared wrappers.

## Development

- `npm install`
- `npm run dev`
- `npm run typecheck`
- `npm run build`

Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` using a local `.env.local` file or the deployment environment. Never expose a Supabase service-role/secret key in browser variables.

## Current status

- Carbon component adoption has started in the shared UI layer, app navigation, login screen and customer workspace.
- Supabase schema migration is a draft and has not been applied.
- Customer CRUD is not yet connected to the database.
- A GitHub Actions build/typecheck workflow is configured. Build success has not yet been verified in this working session.
- No manual Preview or Production deployment was performed.
