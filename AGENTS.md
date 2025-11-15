# AGENTS – klabo.world Next Stack (Source of Truth)

This document supersedes every earlier set of instructions (CLAUDE.md, legacy README, etc.). Follow it exactly—local dev, CI, deployment, and AI workflows are designed around these steps and the modernization plan in `docs/modernization-plan.md`.

## Overview
- **Stack**: Next.js 16 (App Router) + React 19, TypeScript 5, Tailwind 4, Contentlayer (file-first MDX), Prisma + PostgreSQL 17.6 (auth/rate-limit/state only), Redis (rate limiting), Azure Blob Storage (uploads), Azure App Service for Containers.
- **Repo layout** (root):
  - `app/` – Next.js application (App Router). Uses shared configs from `@klaboworld/config`.
  - `packages/config` – shared ESLint + tsconfig presets.
  - `packages/scripts` – TypeScript CLIs (bootstrap/export/migration helpers).
  - `packages/ui` – placeholder for shared UI primitives (shadcn/ui integration).
  - `content/{posts,apps,contexts}` – MDX + JSON source of truth (mirrors legacy `Resources/**`).
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
- tmux (for `just agent-shell`).
- Azure CLI 2.79.0+ for IaC/deploy scripts.

## Reproducible Environment Commands
All commands assume repo root.

| Command | Description |
| --- | --- |
| `just bootstrap` | Enables corepack, pins pnpm 10.22.0, installs workspace deps, writes envinfo to `docs/verifications/bootstrap.md`. |
| `just dev` | Starts Postgres/Redis/Azurite via `docker compose -f docker-compose.dev.yml up -d ...` then runs `pnpm --filter app dev`. |
| `just doctor` | Prints envinfo + docker-compose service status. Must be clean before starting work. |
| `just lint` | Runs `pnpm turbo lint` (Next ESLint + package lint). |
| `just test` | Runs `pnpm turbo test` (Vitest + Playwright, once implemented). |
| `just watch` | Launches Vitest watch mode (TDD loop). |
| `just db-reset` | Applies Prisma migrations and seeds against the local containerized Postgres + Redis. |
| `just load-test` | Executes the short k6 smoke (`scripts/load-smoke.js`). |
| `just agent-shell` | Spawns a tmux layout with dev server, vitest watcher, and Docker logs for human/AI pair work. |
| `pnpm --filter @klaboworld/scripts run export-legacy` | Copies legacy `Resources/{Posts,Apps,Contexts}` into `content/` for Contentlayer. |

## Azure / GitHub CLI Quick Reference

- `az account show` – verify Azure subscription context before touching resources.
- `az webapp list --query "[].{name:name, resourceGroup:resourceGroup}"` – enumerate deployed App Services.
- `az webapp log tail --name <app> --resource-group <rg>` – stream container stdout/stderr for debugging boot issues.
- `az webapp config appsettings list --name <app> --resource-group <rg>` – inspect current environment variables (PORT, DB URLs, etc.).
- `az webapp config appsettings set --name <app> --resource-group <rg> --settings KEY=value` – update App Service env vars (e.g., to define `PORT`).
- `gh run list --limit N` – view recent GitHub Actions runs.
- `gh run watch <run-id>` – tail a CI/CD run in real time.
- `gh run rerun <run-id>` – re-trigger a failed workflow with the same inputs/secrets.

Use `pnpm` commands only via the workspace root; individual package scripts should not be run with npm/yarn.

## Environment Variables
Copy `.env.example` → `.env` and set:

```
DATABASE_URL=postgresql://klaboworld:klaboworld@localhost:5432/klaboworld
REDIS_URL=redis://localhost:6379
UPLOADS_CONTAINER_URL=http://127.0.0.1:10000/devstoreaccount1/klaboworld
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
NEXTAUTH_SECRET=dev-secret
APPLICATIONINSIGHTS_CONNECTION_STRING=
```

`NEXTAUTH_SECRET` must be random in real deployments; the default only works for local dev.

## Dev Containers & Remote Environments
- Open the repo in VS Code and choose **“Reopen in Container”** to get Node 24.11.1 + Docker-in-Docker automatically.
- Post-create hook runs `pnpm install`. After containers start, run `just doctor` inside to verify.

## Local Services
`docker-compose.dev.yml` exposes:
- `db` (Postgres 17.6) on 5432 with creds `klaboworld/klaboworld`.
- `redis` (7.4) on 6379.
- `azurite` on 10000 for blob emulation.

Never point the Next.js app at system postgres/redis—always use the compose services so tests/dev are deterministic.

## Content Workflow
- All posts/apps/contexts live as MDX/JSON under `content/`. Admin server actions will commit via GitHub, so Git history is the single source of truth.
- Content parsing + typing uses Contentlayer (config coming in subsequent steps). When you add/edit files, run `pnpm contentlayer build` (wired into turbo tasks later).

## Testing & TDD Expectations
- Start every feature with a failing test (Vitest or Playwright). Keep `just watch` running.
- Coverage target >=80% for libraries. Add tests to `app/src/tests/**/*` or `packages/**/tests`.
- End-to-end flows (admin CRUD, uploads) belong in Playwright inside `app/tests/e2e`.
- Load/perf smoke: `just load-test` exercises `/` and representative routes.

## AI/Automation Guidance
- MCP resources will expose: `package.json`, `turbo.json`, `infra/main.bicep`, Prisma schema, Contentlayer schema, latest CI logs. Scripts in `packages/scripts` will emit machine-readable summaries for agents.
- Run `scripts/agent-context.sh` (to be added) before asking an AI helper to operate—this prints commands, environment vars, and open tasks.
- Always update `AGENTS.md` + `docs/modernization-plan.md` if you change workflows, commands, or directory structure.

## Deployment Snapshot (future integration)
- `infra/main.bicep` provisions RG, ACR, App Service Plan, Containers, Azure Database for PostgreSQL Flexible Server (17.6), Redis, Blob Storage, Key Vault, Private DNS.
- CI pipelines (to be added) run pnpm bootstrap → lint/test → Next build → Docker build/push → slot deploy → smoke tests.

## Definition of Done (per task)
1. Code + tests ✅
2. `pnpm turbo lint test` ✅
3. Docs updated (README/AGENTS/runbooks) ✅
4. Verification artifact stored in `docs/verifications/` if applicable ✅
5. Modernization plan updated when structural changes occur ✅

Keep this document current. Any contributor—human or AI—should be able to onboard by following the steps above without additional guidance.
