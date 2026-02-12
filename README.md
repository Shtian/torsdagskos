# Torsdagskos

[![Playwright Tests](https://github.com/shtian/torsdagskos/actions/workflows/playwright.yml/badge.svg)](https://github.com/shtian/torsdagskos/actions/workflows/playwright.yml)

Private meetup coordination website for monthly recurring events among close friends.

## Typography

- `Lora` (Google Fonts serif): heading font for `h1`-`h6` and display-style text.
- `Manrope` (Google Fonts sans-serif): body/UI font for app copy, controls, and navigation.

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── components
│   │   ├── EventCard.tsx
│   │   ├── ShadcnIslandDemo.tsx
│   │   └── ui/
│   ├── layouts
│   │   └── Layout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── history.astro
│   │   ├── settings.astro
│   │   └── ...
│   └── styles/
│       └── global.css
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

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `pnpm install`             | Installs dependencies                            |
| `pnpm dev`             | Starts local dev server at `localhost:4321`      |
| `pnpm build`           | Build your production site to `./dist/`          |
| `pnpm preview`         | Preview your build locally, before deploying     |
| `pnpm astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
