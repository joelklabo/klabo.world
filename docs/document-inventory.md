# Documentation Inventory and Naming Conventions

This file is the single source of truth for every Markdown document that should be kept in the repository. All docs live under `docs/` and use kebab-case names; update this inventory whenever a doc is added, retired, or moved, and mark legacy/experimental items explicitly.

## Naming convention
- Directories under `docs/` map to functional areas (e.g., `docs/azure`, `docs/deployment`, `docs/testing`, `docs/security`).
- Filenames are lowercase with hyphen separators (`kebab-case`).
- When you add or archive a doc, update this file and note legacy/experimental status where relevant.

## Inventory by directory

### docs/adr
- `0001-use-nextjs-app-router.md` – Adopt Next.js 16 App Router.
- `0002-sqlite-default-postgres-optional.md` – SQLite default, Postgres optional.
- `0003-azure-monitor-observability.md` – Azure Monitor + Application Insights for telemetry.
- `0004-contentlayer-file-first-content.md` – Contentlayer for type-safe, file-first content.
- `0005-shadcn-ui-component-library.md` – shadcn/ui copy-paste component library approach.
- `0006-monorepo-pnpm-turborepo.md` – Monorepo with PNPM workspaces + TurboRepo.
- `0007-renovate-dependency-updates.md` – Renovate with auto-merge for safe updates.
- `0008-api-layer.md` – tRPC for internal/admin APIs, REST for public surfaces.
- `0009-monorepo-modularization.md` – Modular build strategy and measurable targets.

### docs/azure
- `auth-setup.md` – Azure CLI authorization setup for deployment scripts.
- `authentication-upgrade.md` – Migrating legacy Swift auth into the Next.js stack.
- `deployment-guide.md` – Production App Service/Storage/App Insights wiring.

### docs/deployment
- `checklist.md` – Canonical deployment checklist (moved from repo root).
- `github-token.md` – Provision the GitHub token used by automated content sync.
- `phase5-cutover-checklist.md` – Final cutover runbook for the legacy → modern migration.
- `staging-strategy.md` – How to use staging safely before production deploys.

### docs/design
- `modernization-plan.md` – Warm/playful redesign direction, tokens, typography, and implementation steps.
- `landing-page-ux-review.md` – Deep UX review + simplification decisions for the landing page.
- `tokens.md` – Current typography/spacing/radius token defaults and drift notes.
- `public-ux-audit.md` – Public route audit findings + visual QA checklist.

### docs/architecture
- `overview.md` – High-level system diagram and stack summary.

### docs/experimental
- `design.md` – Deprecated legacy Vapor/Azure local deployment testing plan (kept for reference only).

### docs/guides
- `onboarding.md` – Developer onboarding: setup, workflow, first contribution.
- `coding-partners.md` – Pairing guidelines and rules of engagement.

### docs/integration
- `github.md` – GitHub workflows and how `@klaboworld/scripts` interacts with the repo.

### docs/infra
- `README.md` – Azure Bicep layout, modules, and deployment commands.

### docs/plans
- (deprecated) Kept empty/reserved; all plans now live as beads issues.

### docs/observability
- `slos.md` – Service Level Objectives for key user journeys.

### docs/runbooks
- `admin-content.md` – Publishing, uploads, admin smoke tests.
- `deployment.md` – Deployment runbook and checks.
- `observability.md` – Enabling Application Insights locally/Azure and verifying spans.
- `rollback.md` – Rollback procedure.
- `turbo-cache.md` – Guidance on enabling Turbo remote cache and reading metrics.
- `secrets.md` – Secrets management across local env, GitHub Actions, and Azure.
- `db-recovery.md` – Database recovery steps.
- `feature-flags.md` – Provider-agnostic feature flag guidance.
- `github-projects.md` – Refreshing the GitHub projects snapshot used by home + `/projects`.
- (retired) `build-modularity.md` – superseded by Turbo task changes and build cache epics.

### docs/security
- `migration.md` – Security migration notes (moved from repo root).

### docs/testing
- `ui-testing-plan.md` – Playwright/Vitest strategy.
- `ui-coverage-matrix.md` – Coverage matrix for UI scenarios.
- `navigation-inventory.md` – Public/admin route + test ID inventory for navigation coverage.

### docs/verifications
- `bootstrap.md` – `just bootstrap` env snapshot.
- `doctor.md` – Latest `just doctor` output.
- `infra-deploy.md` – Azure deployment verification log.
- `prisma-generate.md` – Prisma client generation output.
- `contentlayer-schema.md` – Contentlayer schema verification (Phase 1 parity).
- `contentlayer-build.md` – Contentlayer build attempt log (2025-11-14) showing CLI error.
- `legacy-export.md` – Export-legacy migration verification (posts/apps) *(contexts retired Dec 2025)*.
- Phase 0: `phase0-inventory.md` – Baseline parity inventory.
- Phase 1: `phase1-code-organization.md`, `phase1-front-site.md`, `phase1-pages.md`, `phase1-styling.md`, `phase1-testing.md` – Code organization, front-site smoke, page parity, style audit, and test summary.
- Phase 2: `phase2-admin-apps-contexts.md` *(archived)*, `phase2-admin-crud.md`, `phase2-auth.md`, `phase2-integration.md`, `phase2-ui.md`, `phase2-uploads.md` – Admin CRUD, auth, integration, UI, and upload verifications.
- Phase 3: `phase3-apis.md` – Public API parity checks.
- Phase 4: `phase4-playwright-smoke.md` – Playwright smoke coverage.
- Phase 5: `phase5-data-validation.md`, `phase5-load-test.md`, `phase5-monitoring.md`, `phase5-smoke.md`, `phase5-smoke-local.md`, `phase5-stakeholder-approval.md`, `phase5-visual-checks.md` – Final cutover data/latency/visual validations (visual checks include follow-up to enable `/search` GET in production).
- Assets: `screenshots/home.png`, `posts-list.png`, `post-detail.png`, `search-dropdown.png` supporting Phase 1 visual checks.

### docs/vapor (legacy reference only)
- (retired 2025-12-01) `index.md`, `folder-structure.md`, `routing.md`, `controllers.md`, `middleware.md`, `content.md`, `testing.md`, `docker.md`, `leaf-getting-started.md` – Legacy Swift/Vapor guides removed; Next.js stack is canonical.

### Configuration files
- `.github/renovate.json` – Renovate configuration (auto-merge for minor/patch updates).

### Notes on cleaned/retired docs
- Legacy root Azure/deployment/security docs were consolidated into the directories above.
- `CLAUDE.md` was removed once `AGENTS.md` absorbed the working instructions.
- Any new docs must live under `docs/` and be added here immediately.
