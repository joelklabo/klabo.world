# AGENTS – klabo.world Next Stack (Source of Truth)

This document supersedes every earlier set of instructions (CLAUDE.md, legacy README, etc.). Follow it exactly—local dev, CI, deployment, and AI workflows are designed around these steps and the modernization plan in `docs/plans/modernization.md`.

## Overview
- **Stack**: Next.js 16 (App Router) + React 19, TypeScript 5, Tailwind 4, Contentlayer (file-first MDX), Prisma (SQLite file at `app/data/app.db` by default with optional PostgreSQL), optional Redis (rate limiting), Azure Blob Storage (uploads), Azure App Service for Containers.
- **Repo layout** (root):
  - `app/` – Next.js application (App Router). Uses shared configs from `@klaboworld/config`.
  - `packages/config` – shared ESLint + tsconfig presets.
  - `packages/scripts` – TypeScript CLIs (bootstrap/export/migration helpers).
  - `packages/ui` – placeholder for shared UI primitives (shadcn/ui integration).
  - `content/{posts,apps,contexts,dashboards}` – MDX/JSON source of truth (mirrors legacy `Resources/**` + new Observability dashboards).
  - `infra/` – Bicep entry point + modules (WIP) for Azure resources.
  - `docker-compose.dev.yml` – Postgres 17.6, Redis 7.4, Azurite.
  - `.devcontainer/` – reproducible VS Code/Devcontainer setup.
  - `Justfile` – canonical command surface; Makefile will eventually forward to it.
  - `docs/verifications/` – evidence artifacts for each stage gate (store envinfo, doctor output, etc.).

Legacy Swift sources remain for reference but are no longer the system of record.

## Prerequisites
- macOS/Linux with Docker Desktop or Nerdctl.
- [mise](https://mise.jdx.dev/) CLI (`brew install mise`). `just bootstrap` calls `mise install` to provision Node 24.11.1/pnpm 10.22.0 automatically.
- Node.js **24.11.1** (enforced via `.nvmrc` / `.tool-versions`).
- PNPM **10.22.0** via Corepack (run `just bootstrap`).
- tmux (for `just agent-shell` / `scripts/tmux-dev.sh` workflows).
- Azure CLI 2.79.0+ for IaC/deploy scripts.
- Run `./scripts/install-dev-tools.sh` after cloning (and whenever it changes) to install tmux and other shared CLI dependencies via Homebrew.
- Bring up infrastructure services with `docker compose -f docker-compose.dev.yml up -d db redis azurite` only when you need Redis/Azurite or you override `DATABASE_URL` to Postgres. The default SQLite database lives in `app/data/`, so `just dev` works without Docker.
- k6 CLI (`brew install k6`) for running `just load-test` / `k6 run scripts/load-smoke.js`.

## Reproducible Environment Commands
All commands assume repo root.

| Command | Description |
| --- | --- |
| `just bootstrap` | Enables corepack, pins pnpm 10.22.0, installs workspace deps, writes envinfo to `docs/verifications/bootstrap.md`. |
| `just dev` | Boots optional Postgres/Redis/Azurite via `docker compose -f docker-compose.dev.yml up -d ...` (skips automatically if Docker isn’t running) and runs `pnpm --filter app dev`. Always follow this by running `open http://localhost:3000` and `open http://localhost:3000/admin` so the user’s browser reflects the current session. |
| `./scripts/tmux-dev.sh [--detach]` | Launches the tmux-based dev workflow (pane 0: Next dev server, pane 1: Vitest watch, pane 2: shell). Use `--detach` in automation; attach later with `tmux attach -t klabo-dev`. |
| `just doctor` | Prints envinfo + docker-compose service status. Must be clean before starting work. |
| `just lint` | Runs `pnpm turbo lint` (Next ESLint + package lint). |
| `just test` | Runs `pnpm turbo test` (Vitest + Playwright, once implemented). |
| `just watch` | Launches Vitest watch mode (TDD loop). |
| `just db-reset` | Applies Prisma migrations/seeds against whatever `DATABASE_URL` points to (SQLite by default). |
| `just load-test` | Executes the short k6 smoke (`scripts/load-smoke.js`). |
| `just agent-shell` | Spawns a tmux layout with dev server, vitest watcher, and Docker logs for human/AI pair work. |
| `pnpm --filter @klaboworld/scripts run export-legacy` | Copies legacy `Resources/{Posts,Apps,Contexts}` into `content/` for Contentlayer. |
| `pnpm --filter @klaboworld/scripts run new-post -- --title "My Post"` | CLI helper that scaffolds `content/posts/*.mdx` with front matter matching the admin compose flow. |

### Dev Workflow & Browser Mirroring
- `scripts/tmux-dev.sh [--detach]` (also invoked by `just agent-shell`) now provisions Docker services, launches a tmux session with four panes: top-left `pnpm --filter app dev`, top-right `docker compose -f docker-compose.dev.yml logs -f db redis azurite`, bottom-left `pnpm vitest --watch`, bottom-right interactive shell. Keep this running during development to continuously stream server + infra logs alongside your TDD loop.
- Browser mirroring lives in `scripts/maybe-open-dev-browser.sh`. The script reads `.env` (if present) and checks `AUTO_OPEN_BROWSER` (default `false`). When set to `true`, it launches both `DEV_SERVER_URL` (default `http://localhost:3000`) and `ADMIN_SERVER_URL` (default `http://localhost:3000/admin`) via `open`/`xdg-open` so the user’s browser reflects the current dev server session. `just dev` and `scripts/tmux-dev.sh` call this helper automatically—set `AUTO_OPEN_BROWSER=true` whenever the user asks to follow along in real time.
- **Commit workflow:** Always use the globally installed `commit-push-watch.sh` helper so CI is tracked automatically even when you detach and keep working.
  ```bash
  commit-push-watch.sh -m "feat: new dashboard schema" -w "ci|Build, Test, and Deploy to Azure"
  ```
  - It stages all changes, commits with your message, pushes `HEAD`, and ensures the process runs inside a tmux session (auto-creates one if needed).
  - As soon as the tmux window launches, detach (`Ctrl-b d` unless remapped) so you can continue working; the session keeps polling `gh run` and prints status summaries every minute until both workflows finish.
  - Reattach later with `tmux attach -t commit-push-watch.sh-<timestamp>` or simply run `commit-push-watch.sh --help` for session naming options.
  - Never skip this flow—every commit should go through `commit-push-watch.sh` so we catch CI failures immediately.
  - **Before starting ANY new task**, reattach (or run `gh run list --limit 5`) to confirm the previous CI passes. If it failed, fix it *before* doing more work.

## Azure / GitHub CLI Quick Reference

- `az account show` – verify Azure subscription context before touching resources.
- `az webapp list --query "[].{name:name, resourceGroup:resourceGroup}"` – enumerate deployed App Services.
- `az webapp log tail --name <app> --resource-group <rg>` – stream container stdout/stderr for debugging boot issues.
- `az webapp config appsettings list --name <app> --resource-group <rg>` – inspect current environment variables (PORT, DB URLs, etc.).
- `az webapp config appsettings set --name <app> --resource-group <rg> --settings KEY=value` – update App Service env vars (e.g., to define `PORT`).
- `az webapp config container show --name <app> --resource-group <rg>` – confirm which container image/tag is running (e.g., `DOCKER|ghcr.io/<owner>/<image>:<sha>`).
- `gh run list --limit N` – view recent GitHub Actions runs.
- `gh run watch <run-id>` – tail a CI/CD run in real time.
- `gh run rerun <run-id>` – re-trigger a failed workflow with the same inputs/secrets.
- `gh workflow run "Build, Test, and Deploy to Azure" --ref main` – manually kick off the Azure deployment pipeline (enabled via `workflow_dispatch`).

Use `pnpm` commands only via the workspace root; individual package scripts should not be run with npm/yarn.

## Environment Variables
Copy `.env.example` → `.env` and set:

```
DATABASE_URL=file:../data/app.db
REDIS_URL=
UPLOADS_DIR=public/uploads
UPLOADS_CONTAINER_URL=http://127.0.0.1:10000/devstoreaccount1/klaboworld
AZURE_STORAGE_ACCOUNT=
AZURE_STORAGE_KEY=
AZURE_STORAGE_CONTAINER=uploads
SITE_URL=https://klabo.world
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
NEXTAUTH_SECRET=dev-secret
APPLICATIONINSIGHTS_CONNECTION_STRING=
LOG_ANALYTICS_WORKSPACE_ID=
LOG_ANALYTICS_SHARED_KEY=
AUTO_OPEN_BROWSER=false
```

`NEXTAUTH_SECRET` must be random in real deployments; the default only works for local dev.

- `DATABASE_URL` defaults to the tracked SQLite file (`file:../data/app.db` resolves to `app/data/app.db`). Set it to `file:/home/site/wwwroot/data/app.db` in Azure or point it at Postgres when you explicitly run that service via Docker.
- `REDIS_URL` is optional. Leave it blank to use the in-memory rate limiter; set it to `redis://localhost:6379` (from `docker-compose.dev.yml`) when you need distributed backoff.
- `ADMIN_PASSWORD` accepts either plain text (dev) or a bcrypt hash (prod). When you set a hash we store it verbatim, so you never need to keep the clear-text string in Azure settings.
- `AUTO_OPEN_BROWSER` toggles whether `just dev` / `scripts/tmux-dev.sh` automatically run `open http://localhost:3000` and `/admin`; leave it `false` for headless CI or when SSH’d into remote hosts.
- `APPLICATIONINSIGHTS_CONNECTION_STRING` enables OpenTelemetry → Azure Monitor. See `docs/runbooks/observability.md` for setup and verification commands.
- `LOG_ANALYTICS_WORKSPACE_ID` / `LOG_ANALYTICS_SHARED_KEY` are required for the Log Analytics helper (`app/src/lib/logAnalytics.ts`). They’re safe to leave blank locally if you don’t need KQL queries.

## Dev Containers & Remote Environments
- Open the repo in VS Code and choose **“Reopen in Container”** to get Node 24.11.1 + Docker-in-Docker automatically.
- Post-create hook runs `pnpm install`. After containers start, run `just doctor` inside to verify.

## Local Services
`docker-compose.dev.yml` exposes:
- `db` (Postgres 17.6) on 5432 with creds `klaboworld/klaboworld`.
- `redis` (7.4) on 6379.
- `azurite` on 10000 for blob emulation.

These services are optional now that Prisma defaults to SQLite and the rate limiter falls back to memory. Start them only when you explicitly need Redis/Azurite or when you point `DATABASE_URL` at Postgres.

## Content Workflow
- All posts/apps/contexts/dashboards live as MDX/JSON under `content/`. Admin server actions will commit via GitHub, so Git history is the single source of truth.
- Content parsing + typing uses Contentlayer (config coming in subsequent steps). When you add/edit files, run `pnpm contentlayer build` (wired into turbo tasks later).

## Admin UI & Upload Workflow
- `/admin` hosts dashboard + CRUD routes. Pages are **server components** so they’re dynamic-safe; do not convert them to `use client`.
- All admin forms now expose an “Upload image” control that hits `POST /admin/upload-image`. This route requires an admin session and enforces JPEG/PNG/GIF/WebP + 10 MB limits (parity with Vapor).
- Local dev writes uploads to `UPLOADS_DIR` (default `public/uploads` inside the Next app). Files immediately serve at `/uploads/<filename>` because they live under `public/`.
- When `AZURE_STORAGE_ACCOUNT` + `AZURE_STORAGE_KEY` are populated the uploader writes to Azure Blob Storage (container defaults to `uploads`). The JSON response includes the fully-qualified blob URL so editors can paste it anywhere (Markdown, screenshot list, etc.).
- Context editors also get a “Upload + copy URL” helper that copies the blob/local path straight to clipboard for Markdown embeds.
- Production App Service must either (a) mount persistent storage to `UPLOADS_DIR` or (b) set the Azure storage env vars so uploads land in Blob Storage. Prefer option (b) for durability.
- Posts + contexts also expose a “Refresh preview” action on their Markdown fields. This POSTs to `/admin/markdown-preview`, which compiles the MDX (front matter + GFM) via `@mdx-js/mdx` and returns sanitized HTML rendered inside the edit form. The preview pipeline is covered by Vitest (`app/tests/markdown-preview.spec.ts`) so no manual QA is required.
- Dashboards live under `/admin/dashboards` and map 1:1 with `content/dashboards/*.mdx`.
  - Panel types: `chart`, `logs`, `embed`, `link`. Server actions enforce requirements (charts/logs need `kqlQuery`, embeds need `iframeUrl`, links need `externalUrl`) and scrub unused fields before persisting.
  - Chart panels call `runLogAnalyticsQuery` and render inline line/area/bar charts; log panels poll `/admin/dashboards/[slug]/logs` with live severity/search filters.
  - Embed panels show an iframe preview of `iframeUrl`. Link panels render a CTA that opens `externalUrl` (hostname displayed for clarity).
  - Notes/runbooks use the Markdown preview + upload helpers so every dashboard carries operational instructions beside the telemetry.
  - Charts/logs require `LOG_ANALYTICS_WORKSPACE_ID` + `LOG_ANALYTICS_SHARED_KEY`. Leave them blank locally if you want dashboards to display “KQL missing” states without making API calls.

## tmux Dev Workflow
- Launch the full dev environment (Next server + Vitest watcher + Docker logs + shell) with `./scripts/tmux-dev.sh` (pass `--detach` from automation so the script doesn’t grab the terminal).
- The script creates/attaches to a `klabo-dev` tmux session:
  - Pane 0: `pnpm --filter app dev` (Next.js dev server on port 3000).
  - Pane 1: `pnpm vitest --config vitest.config.ts --watch` for TDD.
  - Pane 2: `docker compose -f docker-compose.dev.yml logs -f db redis azurite` (keeps infra + blob emulator output beside the server logs).
  - Pane 3: interactive shell for curls, git, Tailwind rebuilds, etc.
- If the session already exists, the script simply attaches; use `tmux attach -t klabo-dev` to re-enter later.
- Browser mirroring is handled by `scripts/maybe-open-dev-browser.sh`. Leave `AUTO_OPEN_BROWSER=false` when working headless; set it to `true` to make the helper open `DEV_SERVER_URL` + `/admin` in the user’s browser whenever `tmux-dev.sh` or `just dev` runs.

## Public APIs
- `GET /api/contexts` – published contexts metadata (title/summary/tags/dates).
- `GET /api/contexts/search?q=term` – requires ≥2 chars, returns up to 10 matches.
- `GET /api/contexts/:slug` – metadata + raw markdown + rendered HTML (uses the same renderer as admin preview).
- `GET /api/contexts/:slug/raw` – raw markdown with `text/markdown` headers for easy downloads.
- `GET /api/gists/:username/:gistId` – GitHub gist proxy; adds `Authorization: Bearer $GITHUB_TOKEN` automatically if the env var is set to dodge rate limits.
- `GET /api/search?q=term` – combined search across posts/apps/contexts (≥2 chars, max 10 results). `/search` uses this helper directly.
- `GET /rss.xml` – RSS feed for recent posts.
- `GET /feed.json` – JSON Feed (v1.1) for clients that prefer JSON.
- `GET /api/tags` – post/context/combined tag counts; accepts optional `limit` query param.

## Testing & TDD Expectations
- Start every feature with a failing test (Vitest or Playwright). Keep `just watch` running.
- Coverage target >=80% for libraries. Add tests to `app/src/tests/**/*` or `packages/**/tests`.
- End-to-end flows (admin CRUD, uploads) belong in Playwright inside `app/tests/e2e`.
- Load/perf smoke: `just load-test` exercises `/` and representative routes.
- Playwright commands:
  - `cd app && pnpm exec playwright install --with-deps` (once per machine to install browsers).
  - `cd app && pnpm exec playwright test --reporter=list` (local smoke suite).
  - `PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm exec playwright test tests/e2e/home-smoke.e2e.ts` for targeted runs.
- Admin content workflow test (`tests/e2e/admin-content.e2e.ts`) requires env vars: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXTAUTH_SECRET`, `DATABASE_URL`, `UPLOADS_DIR`. Start the Docker services only if you want Redis/Azurite; otherwise the default SQLite + in-memory limiter is sufficient.

## Observability & Telemetry
- `APPLICATIONINSIGHTS_CONNECTION_STRING` enables the OpenTelemetry bootstrap defined in `app/instrumentation.ts`.
- We use `@opentelemetry/sdk-node` with `@azure/monitor-opentelemetry-exporter` plus `getNodeAutoInstrumentations()`, and admin server actions wrap persistence logic with `withSpan` (`app/src/lib/telemetry.ts`).
- Add attributes/events inside those helpers when you need more detail. If the env var is unset, instrumentation no-ops (safe for local dev).
- `scripts/deploy-smoke.sh` hits `/`, `/posts`, `/apps`, `/contexts`, `/api/health` and is invoked automatically in the Azure deploy workflow; run it manually with `SMOKE_BASE_URL=https://your-app ./scripts/deploy-smoke.sh` for quick checks.

## AI/Automation Guidance
- MCP resources will expose: `package.json`, `turbo.json`, `infra/main.bicep`, Prisma schema, Contentlayer schema, latest CI logs. Scripts in `packages/scripts` will emit machine-readable summaries for agents.
- Run `scripts/agent-context.sh` before asking an AI helper to operate—this prints commands, environment vars, and open tasks.
- Always update `AGENTS.md` + `docs/modernization-plan.md` if you change workflows, commands, or directory structure.
- Detailed runbooks live under `docs/runbooks/`. Start with `docs/runbooks/admin-content.md` for a step-by-step guide to composing posts/apps/contexts, upload behavior, and Playwright verification commands.

## Deployment Snapshot (future integration)
- `infra/main.bicep` provisions RG, ACR, App Service Plan, Containers, Azure Database for PostgreSQL Flexible Server (17.6), Redis, Blob Storage, Key Vault, Private DNS.
- CI pipelines (to be added) run pnpm bootstrap → lint/test → Next build → Docker build/push → slot deploy → smoke tests.

## Definition of Done (per task)
1. Code + tests ✅
2. `pnpm turbo lint test` ✅
3. Docs updated (README/AGENTS/runbooks) ✅
4. Verification artifact stored in `docs/verifications/` if applicable ✅
5. Modernization plan updated when structural changes occur ✅

6. For every feature or visible change, capture a representative screenshot of the updated UI **and** run the full test suite (per the "Run all the tests" guidance) before you declare the work complete. Attach or reference the screenshot so I can see the working experience.

Keep this document current. Any contributor—human or AI—should be able to onboard by following the steps above without additional guidance.
## Documentation
- Every Markdown file now lives under `docs/` and follows the `<category>/<kebab-case>.md` pattern noted in `docs/document-inventory.md`. When a new doc is added or an existing doc moves, update that inventory file so people can see the complete list without digging directories.
- Outdated legacy instructions such as `CLAUDE.md` and the root copies of the Azure/deployment/security guides have been removed in favor of the consolidated versions in `docs/azure`, `docs/deployment`, and `docs/security`.
- Refer to `docs/document-inventory.md` for a categorized table of every preserved doc; update it whenever you add, retire, or rename documentation.

## Modernization Plan
- Track overall progress via `docs/plans/modernization-roadmap.md`. Each phase references the deeper plans: `docs/plans/modernization.md`, `docs/plans/dashboard.md`, `docs/plans/feature-parity.md`, and `docs/plans/phase-4-stability.md` so you can jump directly into the phase you are executing. The legacy Vapor plan is now located at `docs/plans/vapor-legacy-plan.md`.
- Use `docs/plans/feature-parity-progress.md` to see the detailed checklist for Phase 0–4 of the feature parity work; update it as tasks move from “pending” to “in progress” to “done.”
- Ensure every phase concludes with verification notes under `docs/verifications/` and the phase section in `docs/plans/modernization-roadmap.md` is updated to note completion or blockers.

## Outstanding work
- Review the items listed under `docs/plans/` (modernization, dashboard, feature-parity, overview) to determine the current next task; these are still the most up-to-date roadmaps for completing the migration.
- Validate the Playwright/Vitest coverage described in `docs/testing/*` whenever you touch UI flows.
- Keep the runbooks under `docs/runbooks/` accurate after every major change; if a runbook becomes obsolete, mark it as such in `docs/document-inventory.md` and archive the content to `docs/experimental/`.
