# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL: UI Verification Required

**NEVER declare a UI feature complete until you have:**

1. Visually verified it with Playwright (`browser_snapshot` or `browser_take_screenshot`)
2. Performed ALL user interactions (clicks, typing, selections, keyboard shortcuts)
3. Confirmed the expected result appears in the browser

This is a REQUIREMENT. "It should work" is not verification. Actually test it.

## ⚠️ CRITICAL: Quality Over Effort

**NEVER consider implementation effort, time, or complexity when proposing solutions.**

- Always pursue the BEST, highest-quality solution
- Never say "this would take too long" or "for simplicity, we could..."
- Never propose a lesser solution because it's "easier to implement"
- If there are multiple approaches, choose based on QUALITY, not effort
- Spare no expense - act as if unlimited time and resources are available

When presenting options, evaluate them on:
- User experience quality
- Technical excellence
- Long-term maintainability
- Correctness and robustness

**NOT on**: implementation time, complexity, or developer effort.

## Quick Reference

```bash
just bootstrap       # First-time setup (mise + pnpm install)
just dev             # Start dev server (+ optional Docker services)
just lint            # ESLint via Turbo
just test            # Vitest via Turbo
just watch           # Vitest watch mode for TDD
just db-reset        # Reset SQLite database
pnpm compile         # TypeScript check (no emit)
```

## Architecture

**Stack**: Next.js 16 (App Router) + React 19 + TypeScript 5.9 + Tailwind 4 + Prisma (SQLite) + Contentlayer (MDX)

**Monorepo structure** (pnpm workspaces + Turbo):
- `app/` - Next.js application (main codebase)
- `content/` - MDX posts, apps, dashboards (source of truth)
- `packages/` - Shared config, scripts, types
- `infra/` - Azure Bicep infrastructure

**Content flow**: MDX files in `content/posts/` → Contentlayer generates types → `lib/posts.ts` loads content → routes render at `/posts/:slug` (published) or `/drafts/:slug` (draft)

**Key directories in `app/src/`**:
- `app/` - Next.js routes and API handlers
- `components/` - React components + `ui/` (shadcn)
- `lib/` - Utilities, services, business logic

## Testing

```bash
just test                                    # All unit tests
just watch                                   # Watch mode
pnpm --filter app exec playwright test       # E2E tests
pnpm --filter app exec playwright install    # First-time browser setup
```

Test files: `app/tests/*.spec.ts` (unit), `app/tests/e2e/*.e2e.ts` (Playwright)

## Linting

```bash
just lint           # Primary lint (ESLint via Turbo)
pnpm check:all      # All linters (ESLint + Knip + jscpd + secretlint + stylelint)
pnpm lint:dead      # Knip - find unused code
pnpm lint:deps      # dependency-cruiser - import boundaries
```

ESLint uses flat config (`eslint.config.mjs`), not `.eslintrc`.

## Important Patterns

**Environment variables**: Server-only vars go in `lib/env.ts`, public vars in `public-env.ts`. ESLint prevents importing `@/lib/env` in client code.

**Post aliases**: `lib/posts.ts` resolves URL aliases defined in frontmatter. Tests in `posts-aliases.spec.ts` validate no duplicates.

**React Compiler**: Enabled - use immutable patterns; shared mutable state can cause issues.

**Turbo task order**: `contentlayer` → `prisma:generate` → `lint` → `test` → `build`. Generated types must exist before TypeScript checks.

## Database

Default: SQLite at `app/data/app.db`. Postgres available via Docker.

```bash
just db-reset                              # Reset to clean state
pnpm --filter app exec prisma studio       # Database GUI
pnpm --filter app exec prisma db push      # Apply schema changes
```

## Creating Content

```bash
pnpm --filter @klaboworld/scripts run new-post -- --title "My Post"
```

Or use admin UI at `/admin` (requires `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env`).

## CI Pipeline

GitHub Actions runs: `pnpm check:all` → `pnpm turbo test` → `pnpm turbo build --filter=app` → Playwright E2E
