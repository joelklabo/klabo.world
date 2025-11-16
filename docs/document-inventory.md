# Documentation Inventory and Naming Conventions

This file is the single source of truth for every Markdown document that should be kept in the repository. All documentation now lives under `docs/` and follows the kebab-case convention described below.

## Naming convention
- Directories under `docs/` roughly map to functional areas (e.g., `docs/azure`, `docs/deployment`, `docs/plans`, `docs/testing`, `docs/security`).
- Every file name is lowercase with hyphen separators (`kebab-case`).
- Whenever new documentation is added, place it into the appropriate directory and update this inventory.

## Inventory by directory

### docs/adr
- `0001-use-nextjs-app-router.md` – Decision to adopt Next.js 16 App Router over Pages Router or alternative frameworks.
- `0002-sqlite-default-postgres-optional.md` – SQLite as default database with optional PostgreSQL for scalability.
- `0003-azure-monitor-observability.md` – Azure Monitor + Application Insights for observability and telemetry.
- `0004-contentlayer-file-first-content.md` – Contentlayer for type-safe, file-first content management.
- `0005-shadcn-ui-component-library.md` – shadcn/ui copy-paste component library approach.
- `0006-monorepo-pnpm-turborepo.md` – Monorepo structure with PNPM workspaces and TurboRepo.
- `0007-renovate-dependency-updates.md` – Renovate for automated dependency updates with auto-merge.

### docs/azure
- `auth-setup.md` – Azure CLI authorization setup guidance used by the deployment scripts.
- `authentication-upgrade.md` – Notes about migrating the legacy Swift admin authentication service into the Next.js stack.
- `deployment-guide.md` – How Azure App Service, Azure Storage, and App Insights are wired up for production.

### docs/deployment
- `checklist.md` – The canonical deployment checklist that previously existed at the repository root.
- `github-token.md` – Instructions for provisioning the GitHub token used by the automated content sync scripts.
- `phase5-cutover-checklist.md` – Final cutover runbook for the legacy → modern site migration.

### docs/experimental
- `design.md` – Experimental feature ideas and notes that are still tracked and revisited as experiments.

### docs/guides
- `coding-partners.md` – Pairing guidelines and rules of engagement for people collaborating in this repository.

### docs/integration
- `github.md` – GitHub-specific workflows such as how the `@klaboworld/scripts` CLI interacts with the repo.

### docs/plans
- `phase-4-stability.md` – Plan for the "Continuing Overview & Stability" phase, focusing on hardening the platform, improving developer experience, and ensuring long-term health.

### docs/observability
- `slos.md` – Defines Service Level Objectives (SLOs) for key user journeys, including page load time, API response time, and error rates.

### docs/deployment
- `staging-strategy.md` – Outlines the strategy and process for utilizing the staging environment to ensure safe and reliable deployments to production.

### docs/runbooks
- `admin-content.md`, `deployment.md`, `observability.md`, `rollback.md`, `secrets.md`, `db-recovery.md` – Established runbooks for run/ops and emergencies.

### docs/security
- `migration.md` – Security migration notes that were previously tracked at the repository root.

### docs/testing
- `ui-testing-plan.md`, `ui-coverage-matrix.md` – Playwright/Vitest strategy and coverage matrix.

### docs/vapor
- Several Vapor-specific tutorials (`index.md`, `folder-structure.md`, `controllers.md`, etc.) preserved for reference but not actively maintained.

### docs/verifications
- Phase-by-phase verification artifacts (`phase0-inventory.md` through `phase5-monitoring.md`, `bootstrap.md`, etc.) that capture test evidence for each milestone.
- `phase1-pages.md` – Playwright smoke suite for `/`, `/posts`, `/apps`, `/contexts`, and search link parity.
- `phase1-styling.md` – Tailwind/tag/highlight.js/style audit confirming the new stack matches the legacy visual tokens.
- `phase1-testing.md` – Vitest + public/admin Playwright regression command summary.
- `phase2-auth.md` – Credential/rate-limiter login verification via the admin suites.
- `phase2-admin-crud.md` – CRUD coverage for posts/apps/contexts using the admin helpers.
- `phase2-uploads.md` – Upload helper route verification with a PNG fixture and cleanup.
- `phase2-ui.md` – Admin layout/components review vs. the legacy Leaf templates.
- `phase2-integration.md` – Combined Playwright integration job covering pages + admin flows.
- `phase3-apis.md` – Public contexts/gist/health/search/tags API proof for Phase 3 parity.

## Configuration Files
- `.github/renovate.json` – Configuration for Renovate to automate dependency updates, including auto-merging for minor and patch updates.

## Notes on cleaned documents
- Removed `CLAUDE.md` because `AGENTS.md` now encapsulates the working instructions.
- Root-level copies of Azure/deployment/security docs were consolidated into the folders above.
- From now on, any new doc should live under `docs/` and be added to this inventory.
