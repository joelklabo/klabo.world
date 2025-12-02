# YOUR JOB:

1. Ask `bd ready` what to do
2. Mark the issue `in_progress`
3. Work on it
4. Check your work, run tests
5. Mark it as 'done'
6. Create new issues or epics for any necessary work, or improvements, you came across in your work.
7. Commit
8. Push
9. GO BACK TO 1!

# IMPORTANT:

- NEVER ask which issue you should pick next, use your best judgement and pick one.
- ALWAYS create new issues/epics if you come across something in the course of your work that should be fixed or improved.
- NEVER give me a summary, or a status report. Just do "Your Job" (See above)

# NOTE:
- If you ever see this error, run `bd doctor` for next steps:
    "⚠️  WARNING: JSONL file hash mismatch detected (bd-160)
     This indicates JSONL and export hashes are out of sync.
     Clearing export hashes to force full re-export."

# VALID STOP REASONS:
- stop reasons: `bd ready` (no tasks), unrecoverable error after retries.

# INVALID STOP REASONS:
- "just reporting progress", "task looks hard", "I've used a lot of tokens", "status update".

## Quick Context
- Stack: Next.js 16 (App Router) + React 19, TypeScript 5, Tailwind 4, Contentlayer MDX, Prisma (SQLite default; Postgres optional), optional Redis, Azure Blob Storage, Azure App Service containers.
- Layout: `app/` (Next app), `packages/{config,scripts,ui}`, `content/{posts,apps,dashboards}`, `infra/` (Bicep), `docs/`, `docker-compose.dev.yml`, `Justfile`, `.devcontainer/`.

## Prereqs
- macOS/Linux, Git, [mise](https://mise.jdx.dev/) (installs Node 24.11.1 + pnpm 10.22.0 via `just bootstrap`).
- Optional: Docker Desktop/Nerdctl for Postgres/Redis/Azurite; k6 for `just load-test`; Azure CLI 2.79+ for infra/deploy work.
- Run `./scripts/install-dev-tools.sh` once to install tmux/helpers.

## Core Commands (repo root)
- `just bootstrap` – enable corepack, install deps, write envinfo.
- `just dev` – start dev server (auto-starts optional docker services if available).
- `./scripts/tmux-dev.sh [--detach]` or `just agent-shell` – tmux layout (dev server, vitest watch, docker logs, shell).
- `just lint` / `just test` / `just watch` / `just load-test` / `just doctor`.
- `pnpm --filter @klaboworld/scripts run export-legacy` and `... run new-post -- --title "My Post"` for content helpers.

## Workflow Guardrails
- Start with `bd ready`; create/mark issues as you work and close only after commit/push via `commit-push-watch.sh -m "..." -w "ci|Build, Test, and Deploy to Azure"`.
- Check previous CI before new work (reattach the commit-push tmux session or `gh run list --limit 5`); fix failures first.
- Use pnpm from the workspace root (no npm/yarn per package). Keep `.env` aligned with `.env.example`.
- If `bd doctor` raises warnings: install the pre-push hook, remove extra JSONL (`beads.left.jsonl` vs `issues.jsonl`), and upgrade bd when possible.
- Update `docs/document-inventory.md` whenever docs move or new ones are added; log improvements as beads issues.

## Dev Workflow & Services
- Default DB is SQLite at `app/data/app.db`; use `docker-compose.dev.yml` only when you need Postgres/Redis/Azurite (`docker compose -f docker-compose.dev.yml up -d db redis azurite`).
- Browser mirroring is off by default; set `AUTO_OPEN_BROWSER=true` to auto-open `/` and `/admin` when running `just dev` or `scripts/tmux-dev.sh`.
- VS Code Dev Containers: “Reopen in Container” to get the pinned toolchain; run `just doctor` inside after attach.

## Env & Secrets
- Copy `.env.example` → `.env`. Key vars: `DATABASE_URL` (defaults to SQLite file; use `file:/home/site/wwwroot/data/app.db` in Azure or a Postgres URL), `ADMIN_EMAIL`/`ADMIN_PASSWORD`, `NEXTAUTH_SECRET` (random in prod), `UPLOADS_DIR` + Azure storage vars, optional `REDIS_URL`, `APPLICATIONINSIGHTS_CONNECTION_STRING`, `LOG_ANALYTICS_WORKSPACE_ID`/`LOG_ANALYTICS_SHARED_KEY`, `AUTO_OPEN_BROWSER`.
- Production must set either `LOG_ANALYTICS_WORKSPACE_ID`/`LOG_ANALYTICS_SHARED_KEY` **or** `APPINSIGHTS_APP_ID`/`APPINSIGHTS_API_KEY` for dashboards; otherwise charts/logs will 401.
- `GITHUB_TOKEN` is optional but recommended so `/api/gists` avoids rate limits in CI.

## Content & Admin
- Source of truth: `content/{posts,apps,dashboards}`. Admin CRUD lives at `/admin` (server components).
- Uploads: local writes to `public/uploads`; with Azure storage vars set, uploader writes to Blob Storage and returns the blob URL.
- Markdown preview + upload helpers are covered by Vitest; full flow in `docs/runbooks/admin-content.md`.

## Testing
- Primary commands: `just lint`, `just test`, `just watch`, `just load-test`.
- Playwright: `cd app && pnpm exec playwright install --with-deps` (first run), then `pnpm exec playwright test` (set `PLAYWRIGHT_BASE_URL` as needed). Admin e2e needs `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXTAUTH_SECRET`, `DATABASE_URL`, `UPLOADS_DIR`.

## Docs & Runbooks
- Inventory: `docs/document-inventory.md`. Onboarding: `docs/guides/onboarding.md`. Pairing: `docs/guides/coding-partners.md`.
- Key runbooks: `docs/runbooks/admin-content.md`, `docs/runbooks/deployment.md`, `docs/runbooks/observability.md`, `docs/runbooks/feature-flags.md`, `docs/runbooks/rollback.md`, `docs/runbooks/db-recovery.md`.
- Design direction: `docs/design/modernization-plan.md`. Infra layout: `docs/infra/README.md`. Legacy Vapor references live under `docs/vapor/` (reference only).

## Deploy/Telemetry Quick Hits
- `scripts/deploy-smoke.sh` runs the multi-endpoint smoke; CI calls it post-deploy. Azure wiring details live in `docs/azure/deployment-guide.md` and `docs/deployment/staging-strategy.md`.
- Observability: set `APPLICATIONINSIGHTS_CONNECTION_STRING` (server) and `NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING` (client). SLOs in `docs/observability/slos.md`.

Keep this document current. Any contributor—human or AI—should be able to onboard by following the steps above without additional guidance.
