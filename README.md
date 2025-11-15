# klabo.world (Next.js Monorepo)

This repository now hosts the production klabo.world stack (Next.js + Contentlayer + Prisma). The legacy Swift/Vapor sources are kept for historical reference only—deployment, content, and tooling all run from the Next.js app described below.

## Quick Start

> Install [mise](https://mise.jdx.dev/) first—`just bootstrap` calls `mise install` to provision Node 24.11.1 and pnpm 10.22.0 automatically.

```bash
just bootstrap          # installs toolchain + workspace deps
cp .env.example .env    # customize DATABASE_URL/REDIS_URL/etc
just dev                # runs the Next dev server (starts optional Docker infra too)
```

### Common Targets

| Command | Description |
| --- | --- |
| `just bootstrap` | Corepack enable + pnpm install + envinfo snapshot. |
| `just dev` | Boots optional docker-compose services (`docker-compose.dev.yml`) and runs `pnpm --filter app dev`. |
| `just lint` / `just test` | Run turborepo lint/test pipelines (ESLint + Vitest placeholder). |
| `just db-reset` | Runs Prisma migrations/seeds against whatever `DATABASE_URL` points to (SQLite by default). |
| `just doctor` | Prints envinfo + docker status (kept under `docs/verifications/`). |
| `just load-test` | Placeholder for k6 smoke tests. |
| `just agent-shell` | Opens tmux layout for AI/human pair sessions. |
| `pnpm --filter @klaboworld/scripts run export-legacy` | Copies legacy `Resources/{Posts,Apps,Contexts}` into `content/` for Contentlayer. |
| `pnpm --filter @klaboworld/scripts run new-post -- --title "My Post"` | Scaffolds `content/posts/*.mdx` with front matter (same slug logic as the admin UI). |

Docker Desktop (or compatible) is only required when you need the optional services from `docker-compose.dev.yml` (Redis for distributed rate limiting, Azurite for blob uploads, or Postgres if you override `DATABASE_URL`). The default SQLite database lives at `app/data/app.db`, so day-to-day development works even without Docker.

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
├── content/                  # MDX/JSON dashboards/posts/apps/contexts
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
- **Data**: Prisma 6.19.0 (SQLite file by default; Postgres via `docker-compose` when needed)
- **Cache**: Redis 7.4 (Dockerized)
- **Testing**: Vitest 4.x (unit), Playwright 1.56 (smoke/e2e), k6 (load)
- **Automation**: TurboRepo 2.6.1, GitHub Actions (`.github/workflows/ci.yml`)

## Environment Variables

Copy `.env.example` to `.env` and update as needed:

```
DATABASE_URL=file:../data/app.db
# Optional: set to redis://... to enable distributed rate limiting
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
GITHUB_TOKEN=...
AUTO_OPEN_BROWSER=false
```

`just dev` reads `.env` automatically because Next.js loads it when starting the dev server.

- `AUTO_OPEN_BROWSER=true` re-enables automatic `open http://localhost:3000` / `/admin` when dev scripts start. Leave `false` for headless/remote environments.
- `DATABASE_URL` defaults to a SQLite file (`../data/app.db` relative to `app/prisma`). For Azure, set it to `file:/home/site/wwwroot/data/app.db` so the DB lives on the persistent volume.
- `NEXTAUTH_URL` should match the domain hosting the app (e.g., `https://klabo.world`) so NextAuth doesn’t redirect users to `http://localhost:3000` in production.
- `LOG_ANALYTICS_WORKSPACE_ID` + `LOG_ANALYTICS_SHARED_KEY` unlock admin dashboard charts/logs. Without them, panels gracefully show “No KQL configured.”

Run `./scripts/install-dev-tools.sh` once after cloning to install tmux (and other CLI helpers) via Homebrew, then use `./scripts/tmux-dev.sh` to launch a tmux session with the dev server + test watcher running together.

## Prisma & Database

1. The default connection string (`file:../data/app.db`) keeps a SQLite file inside `app/data/`. Prisma will create both the directory and database automatically the first time you run `pnpm --filter app exec prisma db push`.
2. Edit `app/prisma/schema.prisma` to change models. Apply changes with `pnpm --filter app exec prisma db push` (CI runs the same command before lint/tests/build).
3. Resetting the database is as simple as deleting `app/data/app.db` or running `just db-reset` (which also works if you point `DATABASE_URL` at Postgres).
4. If you override `DATABASE_URL` to a Postgres instance, start the compose services via `docker compose -f docker-compose.dev.yml up -d db redis azurite` and update the env var accordingly.

## Contentlayer

- Content lives under `content/{posts,apps,contexts,dashboards}`.
- Build the content graph manually with `cd app && pnpm contentlayer build` (tracked logs in `docs/verifications/contentlayer-build.md`).
- Next.js imports will be wired once Contentlayer stabilizes on Node 24; for now the UI renders placeholder copy.

## Admin uploads

- `/admin` exposes compose/edit forms for posts, apps, and contexts. Each “Featured image”, “Icon”, and “Screenshots” field now includes an Upload control that calls `POST /admin/upload-image`.
- Local development stores images inside `UPLOADS_DIR` (defaults to `public/uploads` inside `app/`), so the returned path always looks like `/uploads/<file>`.
- In production, set `AZURE_STORAGE_ACCOUNT`, `AZURE_STORAGE_KEY`, and optionally `AZURE_STORAGE_CONTAINER` to write straight to Azure Blob Storage; the API returns the blob URL so you can paste it anywhere (Markdown, screenshot lists, etc.).
- Context forms also surface a helper that uploads and copies the resulting URL to the clipboard for quick Markdown embedding.
- Post/Context editors now provide a live Markdown Preview button that sends content to `/admin/markdown-preview`, compiles it with MDX (frontmatter + GFM), and renders the static HTML inside the form so you can verify formatting without manual QA.

## Admin dashboards

- Dashboard metadata lives under `content/dashboards/*.mdx` with front matter describing the panel (`panelType`, `chartType`, `kqlQuery`, `iframeUrl`, `externalUrl`, etc.). Notes/runbook text sits beneath the second `---`.
- The admin UI exposes `/admin/dashboards`, `/admin/dashboards/new`, and `/admin/dashboards/[slug]` for CRUD. Panel types:
  - `chart` – runs the provided KQL via `runLogAnalyticsQuery` and renders an inline Recharts line/area/bar chart.
  - `logs` – streams filtered Log Analytics records with live search + severity filters.
  - `embed` – displays the provided iframe URL (Grafana, Azure Portal, etc.).
  - `link` – renders a CTA button that opens the external dashboard in a new tab.
- Charts/logs require `LOG_ANALYTICS_WORKSPACE_ID` + `LOG_ANALYTICS_SHARED_KEY` in the environment. Embed/link panels require `iframeUrl`/`externalUrl` respectively; the server action enforces these invariants before writing MDX or calling GitHub.
- Notes fields now use the Markdown preview + upload helpers so runbooks stay alongside the dashboard definition.

## Public APIs

- `GET /api/contexts` – JSON list of published contexts (metadata only, sorted by updated date).
- `GET /api/contexts/search?q=term` – case-insensitive search across titles/summaries/tags (>=2 chars, max 10 results).
- `GET /api/contexts/:slug` – metadata + raw markdown + rendered HTML for the requested context.
- `GET /api/contexts/:slug/raw` – raw markdown response with `text/markdown` headers for quick copy/download.
- `GET /api/gists/:username/:gistId` – proxy to GitHub’s gist API returning the first file’s content (respects `GITHUB_TOKEN` when configured to avoid rate limits).
- `GET /api/search?q=term` – combined search (posts, apps, contexts). The `/search` page uses this helper with the same ≥2 character rule and returns up to 10 results.
- `GET /rss.xml` – RSS feed of the 20 latest posts.
- `GET /feed.json` – JSON Feed v1.1 for the latest posts.
- `GET /api/tags?limit=15` – returns post/context/combined tag counts for tag cloud UI.

## Observability

- `app/instrumentation.ts` wires `@opentelemetry/sdk-node` with the Azure Monitor exporter. Set `APPLICATIONINSIGHTS_CONNECTION_STRING` to enable telemetry (local or production).
- Auto instrumentation handles routing, and admin server actions emit custom spans via `app/src/lib/telemetry.ts` (e.g., `admin.post.update`). Extend this helper if you need deeper attributes or events.
- `Log Analytics` support is exposed through `LOG_ANALYTICS_WORKSPACE_ID` + `LOG_ANALYTICS_SHARED_KEY`. When set, admin dashboards can run KQL for charts/logs via `app/src/lib/logAnalytics.ts`; leaving them blank disables those panels locally.
- No telemetry traffic is emitted when the connection string is absent, so local development stays quiet unless you opt in.

## Testing

- `pnpm turbo test` runs Vitest unit specs across the workspace (`app/tests/**/*.spec.ts`).
- Playwright smoke tests live in `app/tests/e2e`. Run them locally with `cd app && pnpm exec playwright test`. Set `PLAYWRIGHT_BASE_URL` to point at a running dev/prod server.
- Install browsers (first run or after Playwright upgrades) with `cd app && pnpm exec playwright install --with-deps`.
- Admin Playwright specs (e.g., `tests/e2e/admin-content.e2e.ts`) only need a writable `DATABASE_URL` (the default SQLite file works) plus the usual auth env vars. Start the docker-compose services only if you want Redis/Azurite for parity.
- CI (see `.github/workflows/ci.yml`) launches Docker services, installs browsers, starts a built Next.js server, and runs the Playwright suite headlessly after lint/unit stages.

## Deployment

- `scripts/deploy-smoke.sh` runs a multi-endpoint health check (/, /posts, /apps, /contexts, /api/health). The Azure deploy workflow executes it automatically after pushing the container, and you can run it manually with `SMOKE_BASE_URL=https://your-app scripts/deploy-smoke.sh`.

## CI / CD

`/.github/workflows/ci.yml` runs on pushes and PRs:

1. Checkout + set up pnpm/Node 24.11.1.
2. `pnpm install --ignore-scripts`.
3. `pnpm turbo lint`.
4. `pnpm vitest run`.
5. `pnpm --filter app build` (ensures Next.js compiles with Turbopack).

The legacy `deploy.yml` remains untouched until the new container/deploy pipeline is ready.

## Runbooks & Verification

Detailed operational instructions live under `docs/runbooks/`:

- [`admin-content.md`](docs/runbooks/admin-content.md) – day-to-day publishing, uploads, admin smoke tests.
- [`observability.md`](docs/runbooks/observability.md) – enabling Application Insights locally/in Azure and verifying OpenTelemetry spans.
- [`secrets.md`](docs/runbooks/secrets.md) – managing secrets across local `.env`, GitHub Actions, and Azure Key Vault/App Service settings.

Evidence gathered during bootstrap lives under `docs/verifications/`:

- `bootstrap.md` – envinfo snapshot after `just bootstrap`.
- `doctor.md` – envinfo (Docker unavailable in the CI shell is noted).
- `prisma-generate.md` – output from `pnpm prisma generate`.
- `contentlayer-build.md` – output from `pnpm contentlayer build`.

Keep adding files here when stage gates require proof.

## Troubleshooting

- **just not installed**: install via `brew install just` or vendor a local binary. All Make targets delegate to `just`, so it’s required for day-to-day work.
- **Docker unavailable**: `just doctor` will warn. Without Docker you can still run Next.js/Contentlayer because Prisma targets SQLite, but Redis/Azurite-dependent flows (distributed rate limiting, blob storage emulation) will be skipped.
- **Contentlayer CLI Node 24 bug**: CLI prints `ERR_INVALID_ARG_TYPE` after successful builds. This is a known upstream issue; see modernization plan for mitigation steps.

For deeper architectural details (stage gates, phasing, ops checklists), read `docs/modernization-plan.md` and `AGENTS.md`.
