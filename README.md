# klabo.world (Next.js Monorepo)

This repository now hosts the in-progress modernization of klabo.world. The legacy Vapor app remains for reference, but the source of truth is the new Next.js + Contentlayer + Prisma stack described below.

## Quick Start

```bash
# Ensure Node 24.11.1 + pnpm 10.22.0 (use .nvmrc/.tool-versions)
just bootstrap          # pins pnpm + installs workspaces
cp .env.example .env    # customize DATABASE_URL/REDIS_URL/etc
just dev                # spins up Postgres/Redis/Azurite + next dev server
```

### Common Targets

| Command | Description |
| --- | --- |
| `just bootstrap` | Corepack enable + pnpm install + envinfo snapshot. |
| `just dev` | Starts docker-compose services (`docker-compose.dev.yml`) and runs `pnpm --filter app dev`. |
| `just lint` / `just test` | Run turborepo lint/test pipelines (ESLint + Vitest placeholder). |
| `just db:reset` | Runs Prisma migrations + seeds against local Postgres. |
| `just doctor` | Prints envinfo + docker status (kept under `docs/verifications/`). |
| `just load-test` | Placeholder for k6 smoke tests. |
| `just agent-shell` | Opens tmux layout for AI/human pair sessions. |
| `pnpm --filter @klaboworld/scripts run export-legacy` | Copies legacy `Resources/{Posts,Apps,Contexts}` into `content/` for Contentlayer. |

Docker Desktop (or compatible) must be running because Postgres/Redis/Azurite are managed via `docker-compose.dev.yml`.

## Repository Structure

```
/
├── app/                      # Next.js 16 app (App Router)
│   ├── contentlayer.config.ts
│   ├── prisma/               # schema + migrations + seeds
│   ├── src/app               # Route handlers, layout, UI
│   └── package.json          # app-specific scripts/deps
├── packages/
│   ├── config/               # shared ESLint + tsconfig presets
│   ├── scripts/              # TypeScript CLIs (create-admin/export-legacy)
│   └── ui/                   # placeholder for shared UI primitives
├── content/                  # MDX/JSON source of truth (posts/apps/contexts)
├── infra/                    # Bicep modules (Azure infra WIP)
├── docs/                     # Modernization plan, AGENTS, runbooks, verifications
├── docker-compose.dev.yml    # Postgres 17.6 + Redis 7.4 + Azurite
├── Justfile / Makefile       # canonical command surface
├── pnpm-workspace.yaml       # workspace manifest
└── contentlayer.config.ts    # stub that re-exports ./app/contentlayer.config.ts
```

## Toolchain

- **Runtime**: Node 24.11.1, PNPM 10.22.0
- **Web**: Next.js 16 + React 19 + Tailwind 4
- **Content**: Contentlayer 0.3.4 + MDX (file-first, GitHub-backed)
- **Data**: Prisma 6.19.0 with PostgreSQL 17.6 (Dockerized locally)
- **Cache**: Redis 7.4 (Dockerized)
- **Testing**: Vitest 4.x (unit placeholder), Playwright/k6 to come
- **Automation**: TurboRepo 2.6.1, GitHub Actions (`.github/workflows/ci.yml`)

## Environment Variables

Copy `.env.example` to `.env` and update as needed:

```
DATABASE_URL=postgresql://klaboworld:klaboworld@localhost:5432/klaboworld
REDIS_URL=redis://localhost:6379
UPLOADS_CONTAINER_URL=http://127.0.0.1:10000/devstoreaccount1/klaboworld
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
NEXTAUTH_SECRET=dev-secret
APPLICATIONINSIGHTS_CONNECTION_STRING=
GITHUB_TOKEN=...
```

`just dev` reads `.env` automatically because Next.js loads it when starting the dev server.

## Prisma & Database

1. Start services: `docker compose -f docker-compose.dev.yml up -d db redis` (handled by `just dev`).
2. Create/inspect schema: edit `app/prisma/schema.prisma`.
3. Run migrations locally: `cd app && pnpm prisma migrate dev --name init` (CI uses `pnpm prisma format` + `pnpm prisma generate`).
4. Reset DB: `just db:reset` (drops + re-seeds).

## Contentlayer

- Content lives under `content/{posts,apps,contexts}`.
- Build the content graph manually with `cd app && pnpm contentlayer build` (tracked logs in `docs/verifications/contentlayer-build.md`).
- Next.js imports will be wired once Contentlayer stabilizes on Node 24; for now the UI renders placeholder copy.

## CI / CD

`/.github/workflows/ci.yml` runs on pushes and PRs:

1. Checkout + set up pnpm/Node 24.11.1.
2. `pnpm install --ignore-scripts`.
3. `pnpm turbo lint`.
4. `pnpm vitest run`.
5. `pnpm --filter app build` (ensures Next.js compiles with Turbopack).

The legacy `deploy.yml` remains untouched until the new container/deploy pipeline is ready.

## Verification Artifacts

Evidence gathered during bootstrap lives under `docs/verifications/`:

- `bootstrap.md` – envinfo snapshot after `just bootstrap`.
- `doctor.md` – envinfo (Docker unavailable in the CI shell is noted).
- `prisma-generate.md` – output from `pnpm prisma generate`.
- `contentlayer-build.md` – output from `pnpm contentlayer build`.

Keep adding files here when stage gates require proof.

## Troubleshooting

- **just not installed**: install via `brew install just` or vendor a local binary. All Make targets delegate to `just`, so it’s required for day-to-day work.
- **Docker unavailable**: `just doctor` will warn. Without Docker you can still run Next.js/Contentlayer but Prisma migrations/rate limiting tests will fail.
- **Contentlayer CLI Node 24 bug**: CLI prints `ERR_INVALID_ARG_TYPE` after successful builds. This is a known upstream issue; see modernization plan for mitigation steps.

For deeper architectural details (stage gates, phasing, ops checklists), read `docs/modernization-plan.md` and `AGENTS.md`.
