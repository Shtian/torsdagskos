# PRD: Full Astro App Migration to shadcn Components

  ## Overview

  Migrate the existing Astro application to a shadcn-based component system to achieve a cohesive,
  high-quality interface across the full app. This migration will replace existing custom UI
  components/styles with shadcn equivalents where possible, while preserving current product
  functionality and routing behavior.

  ## Goals

  - Establish a consistent visual language across all pages and UI states.
  - Standardize on reusable shadcn component patterns for maintainability.
  - Complete a full-app UI migration (not a pilot).
  - Improve perceived UI quality without backend/API changes.
  - Ensure all migrated work passes project quality checks.

  ## Quality Gates

  These commands must pass for every user story:

  - pnpm typecheck - Type checking
  - pnpm lint - Linting
  - pnpm test - Automated test suite

  For UI stories:

  - Browser verification is not required for this phase.

  ## User Stories

  ### US-001: Set up shadcn foundation in Astro (React islands)

  Description: As a developer, I want shadcn configured in the Astro app with React islands so that
  all new/migrated UI can use a shared component foundation.

  Acceptance Criteria:

  - [ ] shadcn dependencies and required React integration are installed and configured for Astro.
  - [ ] Base shadcn setup files (config, utility helpers, global style entry points) are present and
    used by the app.
  - [ ] At least one sample shadcn component renders correctly inside an Astro page via a React
    island.
  - [ ] Existing build/dev workflows continue to run without regressions.

  ### US-002: Define app-wide design tokens and base primitives

  Description: As a developer, I want standardized tokens and primitives so that migrated components
  are visually consistent.

  Acceptance Criteria:

  - [ ] App color, spacing, radius, typography, and elevation tokens are defined in a single source of
    truth.
  - [ ] Light mode is the only required theme in this phase.
  - [ ] Core primitives (button, input, card, dialog, dropdown/select, tabs, badge, toast/alert) are
    available via shadcn.
  - [ ] Legacy conflicting base styles are removed or neutralized to avoid token drift.

  ### US-003: Migrate global layout and navigation

  Description: As a user, I want consistent layout and navigation styling so that the interface feels
  cohesive everywhere.

  Acceptance Criteria:

  - [ ] Header, footer, shell/layout wrappers are migrated to shadcn-based structures.
  - [ ] Primary navigation and mobile navigation patterns use shadcn components.
  - [ ] Responsive behavior matches or improves on current behavior across key breakpoints.
  - [ ] No routing/IA changes are introduced.

  ### US-004: Migrate all page-level UI components

  Description: As a user, I want every page to use the same component system so that the experience is
  visually unified.

  Acceptance Criteria:

  - [ ] All existing page-level UI uses shadcn-based components or wrappers.
  - [ ] Existing custom UI components are replaced where shadcn equivalents exist.
  - [ ] Form controls, validation states, empty states, and loading states are migrated consistently.
  - [ ] All major user flows remain functionally unchanged.

  ### US-005: Remove legacy UI artifacts and finalize consistency

  Description: As a developer, I want legacy component/style artifacts removed so that the codebase
  has one clear UI system.

  Acceptance Criteria:

  - [ ] Deprecated custom component files replaced by migration are removed.
  - [ ] Unused legacy CSS rules/utilities are removed.
  - [ ] No duplicate implementations remain for the same UI primitive.
  - [ ] Documentation/README section explains how to use the new shadcn-based UI patterns.

  ### US-006: Validate migration completeness

  Description: As a product owner, I want objective completion checks so that we know the migration is
  done.

  Acceptance Criteria:

  - [ ] A migration checklist maps old component families to new shadcn replacements with completion
    status.
  - [ ] All app routes are verified as migrated in code review scope.
  - [ ] Zero blockers/high-severity regressions remain in migrated UI.
  - [ ] Remaining exceptions (if any) are explicitly listed as follow-up items.

  ## Functional Requirements

  1. FR-1: The system must use Astro with React islands to render shadcn components.
  2. FR-2: The system must provide a single, shared tokenized styling baseline for all migrated UI.
  3. FR-3: The system must replace existing custom UI components with shadcn equivalents where
     feasible.
  4. FR-4: The system must preserve current application behavior, data flows, and routing.
  5. FR-5: The system must support responsive layouts equivalent to or better than current
     implementation.
  6. FR-6: The system must keep this phase limited to light mode only.
  7. FR-7: The system must remove obsolete legacy UI files and styles once replacements are in place.
  8. FR-8: The system must include migration completeness tracking across all pages/routes.
  9. FR-9: Every user story must pass pnpm typecheck, pnpm lint, and pnpm test.

  ## Non-Goals (Out of Scope)

  - Backend or API contract changes.
  - Content/copy rewrites.
  - Major information architecture or routing changes.
  - Introducing dark mode in this phase.
  - Redesigning core product workflows beyond visual/component modernization.

  ## Technical Considerations

  - Use shadcn CLI/component generation patterns compatible with Astro + React.
  - Prefer thin wrapper components only when needed to bridge Astro-specific usage.
  - Plan migration order to reduce merge conflicts (global primitives/layout first, then pages).
  - Track bundle impact and avoid introducing unnecessary duplicate dependencies.

  ## Success Metrics

  - 100% of UI surfaces are migrated to shadcn-based components.
  - Legacy UI component usage is reduced to zero for targeted component families.
  - Quality gates (pnpm typecheck, pnpm lint, pnpm test) pass for all merged migration stories.
  - Stakeholder review confirms cohesive visual consistency across the full app.

  ## Open Questions

  - Which pages/routes should be migrated first to minimize risk and maximize visible progress?
  - Are there any existing custom components with no viable shadcn equivalent that need approved
    exceptions?
  - Should visual regression snapshots be added in a later phase, even though browser verification is
    not required now?
    [/PRD]