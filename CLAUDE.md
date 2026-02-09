# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Astro 5 web application called "Torsdagskos" using Tailwind CSS v4 for styling and Astro DB for data persistence. The project uses pnpm as the package manager and TypeScript with strict type checking.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server (localhost:4321)
pnpm dev

# Build for production
pnpm build

# Preview production build locally
pnpm preview

# Run Astro CLI commands
pnpm astro [command]
```

## Architecture

### Tech Stack
- **Framework**: Astro 5.17+ (SSG/SSR framework)
- **Styling**: Tailwind CSS v4 (integrated via Vite plugin)
- **Database**: Astro DB (integrated via `@astrojs/db`)
- **TypeScript**: Strict mode enabled
- **Package Manager**: pnpm 10.28+

### Project Structure
```
src/
├── pages/          # File-based routing (index.astro is the homepage)
├── layouts/        # Layout components (Layout.astro is the base layout)
├── components/     # Reusable Astro components
├── assets/         # Static assets (SVGs, images)
└── styles/         # Global CSS (global.css imported in Layout)

db/
├── config.ts       # Astro DB table definitions
└── seed.ts         # Database seeding logic
```

### Authentication

**All routes must be protected with authentication**. Every page should verify user login status and redirect unauthenticated users to the login page. No public routes should exist except for the login/signup pages.

### Key Configuration

**astro.config.mjs**:
- Tailwind CSS integrated via Vite plugin (not traditional Astro integration)
- Astro DB enabled as integration
- Standard Astro configuration

**TypeScript**:
- Extends `astro/tsconfigs/strict`
- Includes all files in the project
- Auto-generated types in `.astro/types.d.ts`

### Astro DB

The project uses Astro DB for data persistence. Database configuration is in `db/config.ts` where tables are defined, and `db/seed.ts` contains seeding logic. To work with the database:

```bash
# Access Astro DB commands
pnpm astro db [command]
```

Import and use the database in Astro components or API routes:
```typescript
import { db } from 'astro:db';
```

### Styling

Tailwind CSS v4 is configured via Vite plugin. Global styles are in `src/styles/global.css` and imported in the base Layout component.

## Git Workflow

**Commit Messages**: Always use Conventional Commits format for commit messages:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
- `feat: add user registration form`
- `fix(db): resolve connection timeout issue`
- `docs: update installation instructions`
