# Architecture Overview

A concise map of klabo.world's stack and data flows.

## Runtime
- **Next.js 16 (App Router) + React 19** in `app/`.
- **Contentlayer** compiles MDX/JSON from `content/**` into typed data at build/runtime.
- **Prisma** (default SQLite at `app/data/app.db`; Postgres optional via `DATABASE_URL`).
- **Uploads**: local `public/uploads` or Azure Blob Storage when storage vars are set.
- **Auth**: NextAuth credentials provider; admin routes under `/admin` (server components).
- **Telemetry**: OpenTelemetry → Azure Application Insights; dashboards use Log Analytics API.

## Key modules
- `app/src/lib/posts.ts`, `apps.ts`, `dashboards.ts`: read Contentlayer data.
- `app/src/lib/logger.ts`: structured logging with OTEL context.
- `app/src/components/nostrstack-widgets.tsx`: Nostr tip/share/comments (requires NIP-07 signer).
- `app/src/app/api/*`: public APIs (`search`, `gists`, `tags`, feeds).
- `app/src/app/(admin)`: admin CRUD, dashboards.

## Data flow
1. Content in `content/**` → Contentlayer build → typed data → rendered in pages/APIs.
2. User auth via NextAuth credentials → admin server actions mutate content / uploads.
3. Prisma handles auth/rate-limit/storage records; SQLite file is committed for dev.
4. Dashboards call Azure Log Analytics; requires `LOG_ANALYTICS_WORKSPACE_ID/LOG_ANALYTICS_SHARED_KEY` or App Insights app id/key.

## Environments
- **Local**: SQLite + local uploads; optional docker compose for Postgres/Redis/Azurite.
- **Prod**: App Service container; set `DATABASE_URL`, storage, telemetry secrets. Persistent uploads via Blob or mounted storage.

## Reliability/ops
- Health: `/api/health` reports sqlite mode, version, and missing secrets (telemetry/gists).
- Deploy: GitHub Actions `deploy.yml` builds/pushes container to Azure; smoke tests hit public routes.
- CI: lint/test/build, dependency-review, pnpm audit, contentlayer build.

## Diagram
```mermaid
graph TD
  subgraph Client
    browser[Browser]
  end
  subgraph Frontend
    next[Next.js (app)]
    contentlayer[Contentlayer outputs]
  end
  subgraph Data
    sqlite[(SQLite / Postgres)]
    uploads[(Local uploads / Azure Blob)]
    contentRepo[MDX/JSON content]
  end
  subgraph Observability
    appins[App Insights]
    logs[Log Analytics]
  end

  browser --> next
  contentRepo --> contentlayer --> next
  next --> sqlite
  next --> uploads
  next --> appins
  next -. KQL .-> logs
  logs --> dashboards[Admin dashboards]
```

## Links
- `AGENTS.md`
- `docs/runbooks/admin-content.md`
- `docs/runbooks/observability.md`
