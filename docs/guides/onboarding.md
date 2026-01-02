# Developer Onboarding Guide

Welcome to klabo.world! This guide will help you set up your local development environment and make your first contribution.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Understanding the Codebase](#understanding-the-codebase)
4. [Development Workflow](#development-workflow)
5. [Making Your First Contribution](#making-your-first-contribution)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Getting Help](#getting-help)

## Prerequisites

### Required Software

1. **macOS or Linux** - The project uses Bash scripts and Unix tools
2. **Homebrew** (macOS) - Install from [brew.sh](https://brew.sh)
3. **mise** - Modern tool version manager
   ```bash
   brew install mise
   ```
4. **Docker Desktop** (optional) - Only needed for Redis/PostgreSQL/Azurite
   ```bash
   brew install --cask docker
   ```
5. **Git** - Version control
   ```bash
   brew install git
   ```

### Recommended Tools

- **VSCode** with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - Prisma
  - MDX
- **GitHub CLI** for easier PR management:
  ```bash
  brew install gh
  gh auth login
  ```

## Initial Setup

### 1. Clone the Repository

```bash
git clone git@github.com:joelklabo/klabo.world.git
cd klabo.world
```

### 2. Install Development Tools

```bash
./scripts/install-dev-tools.sh
```

This installs tmux and other required CLI tools via Homebrew.

### 3. Bootstrap the Environment

```bash
just bootstrap
```

This command:
- Ensures mise is installed/activated
- Installs Node 24.11.1 and PNPM 10.22.0
- Runs `pnpm install` for all workspace packages
- Writes env info to `docs/verifications/bootstrap.md`

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your preferred editor. The defaults work for local development:

```env
DATABASE_URL=file:../data/app.db       # SQLite (no Docker needed)
REDIS_URL=                             # Leave blank for in-memory rate limiting
UPLOADS_DIR=public/uploads
NEXTAUTH_SECRET=dev-secret             # Change in production
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me               # Plain text OK for dev
```

Note: production builds (for example `pnpm turbo build --filter=app`) validate `NEXTAUTH_SECRET` and will fail if it is left as `dev-secret`. Use a temporary override (e.g., `NEXTAUTH_SECRET=local-build-secret`) for local builds, then revert.

**Optional Azure Monitoring** (leave blank for local dev):
```env
APPLICATIONINSIGHTS_CONNECTION_STRING=
LOG_ANALYTICS_WORKSPACE_ID=
LOG_ANALYTICS_SHARED_KEY=
NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING=
```

### 5. Initialize the Database

```bash
just db-reset
```

This runs Prisma migrations and seeds the database with initial data.

### 6. Verify Setup

```bash
just doctor
```

Expected output:
- ✅ Node 24.11.1
- ✅ PNPM 10.22.0
- ✅ Docker status (OK if not running - optional)
- ✅ All dependencies installed

If you see PNPM warnings about an unsupported engine, run `mise install` (or `mise use`) to ensure Node 24.11.1 is active before rerunning tests.

## Understanding the Codebase

### Repository Structure

```
/
├── app/                      # Main Next.js 16 application (App Router)
│   ├── src/
│   │   ├── app/              # Routes and layouts
│   │   ├── components/       # React components
│   │   ├── lib/              # Utilities and helpers
│   │   └── tests/            # Vitest unit tests
│   ├── tests/e2e/            # Playwright end-to-end tests
│   ├── prisma/               # Database schema and migrations
│   └── contentlayer.config.ts
├── packages/
│   ├── config/               # Shared ESLint and tsconfig
│   ├── scripts/              # CLI tools (@klaboworld/scripts)
│   └── ui/                   # Shared UI components (future)
├── content/                  # MDX/JSON content (posts, apps, dashboards)
├── infra/                    # Azure Bicep infrastructure definitions
├── docs/                     # Documentation, ADRs, runbooks, plans
├── scripts/                  # Shell scripts for automation
├── Justfile                  # Command recipes (like Makefile but better)
└── pnpm-workspace.yaml       # Monorepo workspace definition
```

### Key Technologies

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Database**: Prisma ORM (SQLite default, PostgreSQL optional)
- **Content**: Contentlayer (type-safe MDX/JSON)
- **Testing**: Vitest (unit) + Playwright (e2e)
- **Observability**: OpenTelemetry + Azure Monitor
- **Monorepo**: PNPM workspaces + TurboRepo

### Read the ADRs

Before diving into code, read the [Architectural Decision Records](/docs/adr/) to understand why we made key choices:

- [ADR 0001: Next.js App Router](/docs/adr/0001-use-nextjs-app-router.md)
- [ADR 0002: SQLite Default](/docs/adr/0002-sqlite-default-postgres-optional.md)
- [ADR 0003: Azure Monitor](/docs/adr/0003-azure-monitor-observability.md)
- [ADR 0004: Contentlayer](/docs/adr/0004-contentlayer-file-first-content.md)
- [ADR 0005: shadcn/ui](/docs/adr/0005-shadcn-ui-component-library.md)
- [ADR 0006: Monorepo](/docs/adr/0006-monorepo-pnpm-turborepo.md)
- [ADR 0007: Renovate](/docs/adr/0007-renovate-dependency-updates.md)

## Development Workflow

### Starting the Dev Server

Before coding, run `bd ready` to pick an unblocked issue.

**Option 1: Simple (Recommended)**
```bash
just dev
```

This starts the Next.js dev server on http://localhost:3000. No Docker needed unless you override `DATABASE_URL` to Postgres or want Redis.

**Option 2: Full Environment (Recommended for experienced devs)**
```bash
./scripts/tmux-dev.sh
```

This launches a tmux session with four panes:
- **Top-left**: Next.js dev server
- **Top-right**: Docker logs (Postgres, Redis, Azurite)
- **Bottom-left**: Vitest watch mode
- **Bottom-right**: Shell for git commands

Detach with `Ctrl-b d` and reattach later with `tmux attach -t klabo-dev`.

### Common Commands

| Command | Description |
|---------|-------------|
| `just dev` | Start Next.js dev server |
| `just lint` | Run ESLint across all workspaces |
| `just test` | Run all tests (Vitest + Playwright) |
| `just watch` | Run Vitest in watch mode for TDD |
| `just db-reset` | Reset and seed the database |
| `just load-test` | Run k6 load tests |
| `just doctor` | Check environment health |
| `just agent-shell` | tmux layout for dev server + vitest + docker logs |

### Working with Content

Content lives in `content/` as MDX or JSON files:

```bash
# Create a new blog post
pnpm --filter @klaboworld/scripts run new-post -- --title "My Post Title"

# Or use the admin UI
open http://localhost:3000/admin
```

The admin UI commits changes to Git automatically (requires `GITHUB_TOKEN` or manual commits).

### Working with Components

We use shadcn/ui for UI components. To add a new component:

```bash
cd app
pnpm dlx shadcn@latest add button
```

This copies the component source into `app/src/components/ui/`. Customize as needed.

### Database Changes

1. Edit `app/prisma/schema.prisma`
2. Generate migration:
   ```bash
   cd app
   pnpm exec prisma migrate dev --name add_new_field
   ```
3. Prisma Client regenerates automatically

## Making Your First Contribution

### 1. Find an Issue

- Run `bd ready` (no blockers) or `bd list --status open` to pick work. Avoid asking which issue to take.

### 2. Create a Branch

```bash
git checkout -b feature/my-feature-name
```

### 3. Write Tests First (TDD)

```bash
just watch
```

Write a failing test, then implement the feature.

### 4. Implement Your Change

Follow these guidelines:
- **Server Components by default** - Use `'use client'` only when needed
- **TypeScript strict mode** - Fix all type errors
- **Tailwind for styling** - Use design tokens from `globals.css`
- **Small, focused commits** - One logical change per commit

### 5. Run Quality Checks

```bash
just lint          # Must pass
just test          # Must pass
just load-test     # Smoke test (optional)
```

### 6. Commit and Push

Commit and push your change:

```bash
git commit -m "feat: add new feature"
git push
```

Check CI in GitHub or with `gh run list --limit 5`.

### 7. (If using PRs)

Open a PR from your branch if the workflow requires review; otherwise pushes to `main` go straight through CI.

## Testing

### Unit Tests (Vitest)

```bash
just watch                                  # Interactive watch mode
cd app && pnpm test                         # Run once
cd app && pnpm test path/to/test.spec.ts   # Single file
```

Tests live in `app/src/tests/` or co-located with components.

### E2E Tests (Playwright)

```bash
# First time: install browsers
cd app && pnpm exec playwright install --with-deps

# Run tests
cd app && pnpm exec playwright test

# Run specific test
cd app && pnpm exec playwright test tests/e2e/home-smoke.e2e.ts

# Debug mode
cd app && pnpm exec playwright test --debug
```

### Load Tests (k6)

```bash
just load-test
```

Runs smoke tests against http://localhost:3000.

## Deployment

Pushes to `main` trigger the “Build, Test, and Deploy to Azure” workflow: lint/tests → Next build → container build/push → staging slot deploy → smoke tests. See `docs/deployment/checklist.md` and `docs/azure/deployment-guide.md`.

## Getting Help

- **Documentation**: Check `/docs` folder
- **ADRs**: Understand decisions in `/docs/adr`
- **Runbooks**: Operational guides in `/docs/runbooks`
- **Issues**: Ask questions on GitHub Issues
- **Code Comments**: Many files have helpful comments
- **AGENTS.md**: Comprehensive reference for AI assistants (useful for humans too!)

### Useful Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Playwright Docs](https://playwright.dev)

### Common Issues

**Issue**: `pnpm install` fails  
**Fix**: Run `mise install` to ensure Node 24.11.1 is active

**Issue**: Database errors  
**Fix**: Run `just db-reset` to recreate the database

**Issue**: Port 3000 already in use  
**Fix**: Kill existing process with `lsof -ti:3000 | xargs kill -9`

**Issue**: `pnpm turbo build --filter=app` fails due to `NEXTAUTH_SECRET=dev-secret`  
**Fix**: Temporarily set a non-dev secret for the build (`NEXTAUTH_SECRET=local-build-secret`) and restore afterward

**Issue**: Contentlayer build errors  
**Fix**: Run `cd app && pnpm contentlayer build` manually to see full errors

**Issue**: Playwright tests fail locally  
**Fix**: Ensure dev server is running on port 3000 before tests

**Issue**: `pnpm dev` fails with `Watchpack Error (watcher): Error: EMFILE: too many open files, watch`  
**Fix**: Re-run with polling enabled: `WATCHPACK_POLLING=true CHOKIDAR_USEPOLLING=true pnpm dev`

## Next Steps

1. ✅ Complete this onboarding guide
2. ✅ Run `just dev` and explore http://localhost:3000
3. ✅ Run `bd ready` and pick a P1/P2 from the ready list.
4. ✅ Make a change, commit + push, then confirm CI in GitHub or `gh run list`.
5. ✅ Join the team discussions and ask questions

Welcome to the team! 🚀
