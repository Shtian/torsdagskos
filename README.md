# Torsdagskos

[![Playwright Tests](https://github.com/shtian/torsdagskos/actions/workflows/playwright.yml/badge.svg)](https://github.com/shtian/torsdagskos/actions/workflows/playwright.yml)

Private meetup coordination website for monthly recurring events among close friends.

## Typography

- `Lora` (Google Fonts serif): heading font for `h1`-`h6` and display-style text.
- `Manrope` (Google Fonts sans-serif): body/UI font for app copy, controls, and navigation.

## shadcn Usage Conventions

- Import reusable primitives from `@/components/ui` (or the specific file under `src/components/ui/*` when needed).
- In `.astro` templates, style links/buttons with `buttonVariants()` for consistent actions.
- Keep page shells and sections aligned on shadcn card primitives (`CardHeader`, `CardContent`, `CardFooter`).
- Keep interactive feedback inline in page/form shells (for example `form-feedback-panel` and `rsvp-feedback-panel`) instead of toast-based UX.
- Keep visual theming centralized in `src/styles/global.css` tokens.

## Migration Completion

- Full migration status and old-to-new mapping checklist: `docs/shadcn-migration-checklist.md`
- Current state: all planned migration stories are implemented and verified.

## Spacing Audit

- App-wide spacing audit checklist for follow-up fixes: `docs/spacing-audit-checklist.md`

## Approved Exceptions and Follow-up

- Exception: Clerk auth UIs (`SignIn`/`SignUp`) remain provider-rendered; only local wrapper shells are styled with project shadcn patterns.
- Exception: `src/components/ShadcnIslandDemo.tsx` is retained as an interactive primitive regression surface.
- Follow-up: when adding new routes/components, default to existing shadcn primitives first and extend `src/components/ui/*` only when the pattern is reusable.
- Follow-up: if a new primitive is introduced (for example toast/command), document usage conventions and checklist updates in both `README.md` and `docs/shadcn-migration-checklist.md`.

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── docs/
│   ├── shadcn-migration-checklist.md
│   └── spacing-audit-checklist.md
├── public/
│   └── favicon.svg
├── src
│   ├── components
│   │   ├── EventCard.tsx
│   │   ├── ShadcnIslandDemo.tsx
│   │   └── ui/
│   ├── layouts
│   │   └── Layout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── history.astro
│   │   ├── settings.astro
│   │   └── ...
│   └── styles/
│       └── global.css
├── tests/
│   └── *.spec.ts
├── prd.json
├── progress.txt
├── playwright.config.ts
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command | Action |
| :------ | :----- |
| `pnpm install` | Installs dependencies |
| `pnpm dev` | Starts local dev server at `localhost:4321` |
| `pnpm build` | Build your production site to `./dist/` |
| `pnpm preview` | Preview your build locally, before deploying |
| `pnpm lint` | Run Biome local checks |
| `pnpm lint:ci` | Run Biome CI checks |
| `pnpm lint:fix` | Apply Biome safe fixes and formatting |
| `pnpm format` | Format files with Biome |
| `pnpm format:check` | Check formatting with Biome |
| `pnpm astro ...` | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro -- --help` | Get help using the Astro CLI |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
