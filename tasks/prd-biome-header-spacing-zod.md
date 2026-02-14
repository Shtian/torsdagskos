[PRD]
# PRD: BiomeJS Adoption, Header UX Refinement, Spacing Consistency, and Zod Validation

## Overview
This batch now starts by introducing BiomeJS for formatting and linting, then improves header UX, resolves spacing inconsistencies across the app, and adds Zod validation for forms and API boundaries.

## Goals
- Standardize formatting/linting with BiomeJS.
- Improve navigation clarity with link-style header nav and authenticated profile dropdown.
- Improve visual consistency via app-wide spacing review/fixes.
- Increase data safety with Zod validation in forms and API boundaries.

## Quality Gates
These commands must pass for every user story:
- `biome check`
- `astro check`
- `typecheck`
- `unit tests`

For UI-impacting stories, also include:
- `playwright` tests if UI changed

## User Stories

### US-001: Introduce BiomeJS for Formatting and Linting
**Description:** As a developer, I want BiomeJS set up for formatting and linting so that code quality is consistent and tooling is faster/simpler.

**Acceptance Criteria:**
- [ ] BiomeJS is added and configured in the project.
- [ ] Project scripts include Biome commands for lint/format checks.
- [ ] Existing lint/format tooling is removed or aligned to avoid duplicate/conflicting checks.
- [ ] CI/local quality flow uses Biome as the lint/format gate.
- [ ] Documentation is updated with Biome usage commands.

### US-002: Convert Header Navigation to Link-Style Affordances
**Description:** As a user, I want header navigation items to look and behave like links so navigation is immediately clear.

**Acceptance Criteria:**
- [ ] Header nav uses semantic links for navigation actions.
- [ ] Styling is plain text links with underline on hover.
- [ ] Active route has a persistent active indicator.
- [ ] Keyboard focus states are visible and accessible.
- [ ] Navigation destinations remain unchanged.

### US-003: Add Logged-In Profile Dropdown in Header
**Description:** As a logged-in user, I want a profile dropdown so I can quickly access account actions.

**Acceptance Criteria:**
- [ ] Authenticated state shows a profile trigger in header.
- [ ] Dropdown contains exactly: `Profile`, `Settings`, `Log out` (in order).
- [ ] Dropdown supports click and keyboard interaction (Enter/Space/Escape).
- [ ] `Log out` ends session and updates header state.
- [ ] Logged-out state shows only `Login` link.

### US-004: Perform App-Wide Design Review and Fix Spacing Inconsistencies
**Description:** As a user, I want consistent spacing across pages so the UI feels polished and predictable.

**Acceptance Criteria:**
- [ ] Review covers entire app, including feature views.
- [ ] Inconsistent spacing is documented and corrected.
- [ ] Existing spacing/token conventions are preserved (no new scale introduced).
- [ ] Responsive layout checks pass on primary desktop/mobile breakpoints.
- [ ] No regressions in key layouts (header, forms, lists, content sections).

### US-005: Introduce Zod Validation in Forms
**Description:** As a user, I want invalid input blocked with clear field errors so I can fix issues before submitting.

**Acceptance Criteria:**
- [ ] Scoped forms use explicit Zod schemas.
- [ ] Invalid submissions are blocked.
- [ ] Field-level, user-friendly errors are shown.
- [ ] Valid submissions continue to work without regressions.
- [ ] Validation logic is reusable and aligned with project patterns.

### US-006: Introduce Zod Validation at API Boundaries
**Description:** As a developer, I want API boundary payloads validated so invalid data is rejected early.

**Acceptance Criteria:**
- [ ] Scoped incoming requests are validated with Zod before business logic.
- [ ] Scoped response/consumed payload validation is added where applicable.
- [ ] Validation failures return controlled, consistent errors.
- [ ] No uncaught exceptions from schema mismatches.
- [ ] Existing API flows remain green in tests.

## Functional Requirements
1. FR-1: The system must use BiomeJS as the project’s lint/format tool.
2. FR-2: The system must expose Biome lint/format commands via project scripts.
3. FR-3: Header navigation must be semantic links with underline-on-hover style.
4. FR-4: Header must show authenticated profile dropdown with `Profile`, `Settings`, `Log out`.
5. FR-5: Header must show only `Login` when unauthenticated.
6. FR-6: Spacing inconsistencies across app pages must be identified and corrected using existing conventions.
7. FR-7: Forms in scope must validate input with Zod and block invalid submissions.
8. FR-8: API boundaries in scope must validate payloads with Zod and return controlled errors.

## Non-Goals
- Full rebrand/redesign.
- New global spacing scale or full design system replacement.
- Additional profile menu items beyond specified three.
- Full one-pass migration of every form/endpoint if not in scope.

## Technical Considerations
- Migrate lint/format config carefully to prevent CI/editor conflicts.
- Reuse existing auth/session and menu primitives for dropdown behavior.
- Prefer shared Zod schemas across client/server boundaries when architecture allows.
- Keep error messaging and API error shape aligned with current conventions.

## Success Metrics
- BiomeJS is the active lint/format gate in local and CI workflows.
- Header nav and profile interactions are accessible and behave as specified.
- Spacing inconsistencies are reduced across reviewed pages with no major regressions.
- Validation errors are caught earlier in forms/API flows.
- All quality gates pass, including Playwright when UI changes.

## Open Questions
- Exact list of forms and endpoints for initial Zod rollout.
- Whether to enforce Biome formatting in pre-commit hooks now or later.
[/PRD]
