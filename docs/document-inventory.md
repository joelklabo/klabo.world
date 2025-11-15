# Documentation Inventory and Naming Conventions

This file is the single source of truth for every Markdown document that should be kept in the repository. All documentation now lives under `docs/` and follows the kebab-case convention described below.

## Naming convention
- Directories under `docs/` roughly map to functional areas (e.g., `docs/azure`, `docs/deployment`, `docs/plans`, `docs/testing`, `docs/security`).
- Every file name is lowercase with hyphen separators (`kebab-case`).
- Whenever new documentation is added, place it into the appropriate directory and update this inventory.

## Inventory by directory

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
- `dashboard.md` – The observability dashboard roadmap.
- `feature-parity.md` – Plans for matching the legacy Swift feature set.
- `modernization.md` – High-level modernization plan that maps the migration phases.
- `overview.md` – Current iteration of the implementation plan keeping work scoped.

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

## Notes on cleaned documents
- Removed `CLAUDE.md` because `AGENTS.md` now encapsulates the working instructions.
- Root-level copies of Azure/deployment/security docs were consolidated into the folders above.
- From now on, any new doc should live under `docs/` and be added to this inventory.
