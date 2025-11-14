# Modernization Plan – Dependencies, Code Organization, Deployment

This plan commits to delivering a fully modernized klabo.world with no loose ends: precise dependency strategy, concrete repo/code structure, and end-to-end Azure deployment automation. Following these steps takes us from the current Vapor app to a resilient system that can be maintained indefinitely.

This revision responds directly to review feedback: the plan below is strictly organized by the three critical angles (dependencies, code layout, deployment/operations) and each section contains the exact tasks, guardrails, and success criteria required to go from blueprint to a permanently reliable production system.

> **Source of Truth Decision (per critique):** Content stays **file-first**. Posts, apps, and contexts live as MDX/JSON files under `content/**`, mirroring the current `Resources/**` workflow and keeping GitHub/Git as the canonical store. PostgreSQL is reserved for auth (admins, sessions, rate limiting), operational metadata, and future dynamic features. There is no dual-write between Postgres and MDX; admin CRUD continues to commit through GitHub APIs (or local filesystem for dev) so every change is backed by git history.

---

## 1. Dependency Strategy

*Version verification completed 2025-11-14 (UTC) using official registries and release feeds; key packages are annotated with the exact release that was current at that time.*

### 1.1 Core Runtime Stack
- **Node.js 24 LTS (v24.11.1)** – base runtime for Next.js and tooling.
- **Next.js 16 (v16.0.3, App Router)** – SSR, static generation, server actions, built-in routing, hybrid ISR.
- **TypeScript 5 (v5.9.3)** – project-wide type safety.
- **React 19 (v19.2.0) + React Server Components** – interactive UI and streaming.
- **Tailwind CSS 4 (v4.1.17) + PostCSS (v8.5.6)** – utility-first styling; includes autoprefixer.
- **shadcn/ui CLI (v0.9.5) + Radix Primitives (e.g., `@radix-ui/react-slot` v1.2.4)** – accessible, themeable components.
- **Zod (v4.1.12)** – runtime validation for API payloads.

### 1.2 Data & Content
- **Prisma ORM (v6.19.0)** – schema definitions, migrations, typed client, seeding for admin accounts, sessions, rate limiter keys, and future app-specific tables (but *not* posts/apps/contexts content).
- **PostgreSQL 17.6** (Azure Flexible Server GA; PG18 is still preview per Microsoft Learn) – stores authentication, session, audit, and operational data; sized for transactional workloads without duplicating file content.
- **Contentlayer (v0.3.4) + MDX (`@mdx-js/mdx` v3.1.1)** – compile Markdown/MDX into typed data for the blog and context docs; Contentlayer emits TypeScript types for the file-first SoT. We pin versions because the project is low-velocity.
- **Azure Blob Storage SDK (`@azure/storage-blob` v12.29.1)** – signed upload URLs, asset management, integration with managed identities; blob paths become references in MDX front matter.

### 1.3 Authentication & Security
- **NextAuth/Auth.js (`next-auth` v4.24.13)** – configured strictly with a **Credentials provider** + argon2id hashing for admin logins (no unused OAuth scope creep). Prisma adapter stores admin + session data in Postgres.
- **@node-rs/argon2 (v2.0.2)** – password hashing for admin accounts.
- **Next.js `headers()`** powered CSP/HSTS/XCTO – Helmet is not used on this stack; security headers are emitted centrally in `next.config.ts`.
- **rate-limiter-flexible (v8.2.1)** backed by **Azure Cache for Redis** so throttling works across App Service instances.

- **PNPM 10 (v10.22.0)** – package manager for monorepo workspaces.
- **TurboRepo (`turbo` v2.6.1)** – orchestrates `build`, `lint`, `test`, `deploy` pipelines with caching.
- **ESLint (v9.39.1 with `@next/eslint-plugin-next` v16.0.3) + Prettier (v3.6.2) + Husky (v9.1.7)** – lint/format enforced via hooks.
- **Vitest (v4.0.9) + React Testing Library (`@testing-library/react` v16.3.0)** – unit/component tests.
- **Playwright (`@playwright/test` v1.56.1)** – end-to-end tests for admin flows, uploads, navigation; tests run against the `next start` standalone output to catch prod-only issues.
- **Storybook (`@storybook/react` v10.0.7)** – component catalog and visual regression guard (Chromatic optional).
- **Make + Justfile** – existing Make targets remain; `just` wraps pnpm/Turbo commands for consistency with current scripts and agent workflows.
- **k6 (v1.4.0)** – load testing before go-live.

### 1.5 Observability & Ops
- **OpenTelemetry SDK (`@opentelemetry/sdk-node` v0.208.0)** – instrument API routes and server actions, exporting to Application Insights via `instrumentation.ts`.
- **Azure Application Insights** – metrics, tracing, logs, availability tests.
- **Azure CLI (v2.79.0) + Bicep** – provisioning and maintenance of Azure resources (Terraform removed to avoid duplicated IaC per critique).
- **Snyk (v1.1300.2)/Trivy (v0.67.2) scans** – continuous dependency and container security.

All dependencies will be pinned in `pnpm-lock.yaml`, scanned in CI, and updated regularly via Renovate (v42.11.0, configured to open automated PRs).

### 1.6 Adoption Order & Governance
1. **Foundation (Weeks 1-2)** – bootstrap repo with PNPM, Turbo, Next.js, Tailwind, Prettier, ESLint; check in lockfile immediately.
2. **Data Layer (Weeks 2-3)** – introduce Prisma/Postgres for auth/sessions/rate-limit tables while finalizing the Contentlayer + MDX file pipeline. Block merges without `pnpm prisma migrate dev` artifacts.
3. **Security (Week 3)** – enable Auth.js credentials provider, configure `headers()` for CSP/HSTS, wire Redis-backed rate limiting, and confirm argon2 hashing. CI runs `pnpm lint:security` verifying headers and dependency scans.
4. **Tooling/Ops (Week 4)** – integrate Playwright, Vitest, Storybook, and k6 scripts; hook Renovate + Dependabot for monitoring upstream releases.
5. **Observability (Week 4)** – wire OpenTelemetry exporters and Application Insights in dev/staging to verify traces prior to production cutover.
6. **Governance** – Renovate opens weekly dependency bumps, `pnpm audit` runs nightly, and CI fails on known vulnerabilities. Every dependency addition requires an ADR entry explaining rationale and upgrade path.

### 1.7 Stage Gates & Confidence Checklist
Each adoption phase is considered “done” only when every gate below passes locally and in CI:
1. **Foundation Gate**
   - `pnpm dlx envinfo --system --binaries --browsers` recorded to prove contributors share the same baseline.
   - `pnpm install --frozen-lockfile` succeeds in a clean container (`node:24-slim`) and `pnpm doctor` reports no issues.
   - Turbo cache hit rate ≥80% for lint/test on repeat runs (verified via `turbo run lint test --summary`).
2. **Data Layer Gate**
   - `pnpm prisma migrate dev`/`pnpm prisma db pull` succeed against Dockerized Postgres 17.6 and produce no drift.
   - `pnpm contentlayer build` runs in <10s on dev hardware; generated types checked in.
   - Admin CLI script `pnpm scripts/create-admin` creates hash+record end-to-end.
3. **Security Gate**
   - `pnpm lint:security` (custom ESLint rule for CSP header presence) passes.
   - Redis-backed `rateLimiter.consume()` is exercised via `pnpm test rate-limit` targeting Azurite + redis-stack container.
   - Playwright spec `auth.spec.ts` validates login, rate limiting, logout flows.
4. **Tooling/Ops Gate**
   - Storybook static build compares against Chromatic (or `pnpm chromatic --exit-zero-on-changes`) to prove UI coverage.
   - k6 smoke (`k6 run scripts/load.js --vus 10 --duration 1m`) hits ISR endpoints inside docker-compose with success ≥ 99%.
5. **Observability Gate**
   - `instrumentation.ts` verified by hitting staging slot and confirming spans in App Insights via Kusto query (`traces | where cloud_RoleName == 'app-klaboworld-staging'`).
   - Alert rules tested by temporarily forcing a 500 (`pnpm scripts trigger-alert`) and verifying notification arrives.

No phase is closed without linking evidence (logs, screenshots, query IDs) in the project tracker; this ensures we only attempt the next stage with confidence.

---

## 2. Code & Repository Organization

### 2.1 Monorepo Layout
```
/
├── app/                     # Next.js application
│   ├── app/                 # Route handlers (app router)
│   ├── components/          # Reusable UI components (shadcn/ui + custom)
│   ├── contentlayer.config.ts
│   ├── lib/                 # Helpers (auth, DB, cloud storage, telemetry)
│   ├── mdx-components/      # Custom MDX components (gist embeds, callouts)
│   ├── prisma/              # Prisma schema, migrations, seeds
│   ├── public/              # Static assets (favicon, fallback images)
│   ├── styles/              # Tailwind entry + global CSS resets
│   └── tests/               # Vitest + Playwright specs co-located or dedicated
├── packages/
│   ├── config/              # Shared config (eslint, prettier, tsconfig base)
│   ├── scripts/             # TypeScript CLI scripts (setup, deploy, migrate)
│   └── ui/                  # Optional separate UI package if needed later
├── infra/
│   ├── main.bicep           # Azure IaC entry (single source of truth)
│   ├── modules/             # Parameterized modules: app service, db, storage
│   └── envs/                # Environment-specific parameter files
├── content/
│   ├── posts/               # MDX posts (mirrors existing blog)
│   └── contexts/            # MDX agent contexts
├── docs/                    # Architectural docs, AGENTS.md, runbooks
├── justfile                 # Dev commands
├── package.json             # Workspace root scripts
├── pnpm-workspace.yaml
├── turbo.json               # Turborepo pipeline config
└── README.md
```

### 2.2 Coding Standards & Practices
- **TypeScript strict mode** enforced; no `any` without justification.
- **Absolute imports** via `tsconfig.json` path aliases (`@/lib/db`, `@/components/...`).
- **Server vs Client modules** explicitly annotated (and `use client` for interactive components).
- **API route handlers** reside in `app/api/*`; server actions for admin forms to avoid client round trips.
- **MDX Content**: each file has front matter validated by Contentlayer schema. Admin UI edits write directly to MDX/JSON through GitHub commits; there is no Postgres copy of content.
- **Prisma Layer**: `prisma/schema.prisma` defines models + relations; `prisma/migrations/*` committed. `prisma/seed.ts` seeds base users, sample posts, contexts, apps.
- **Tests**: Vitest for libs/components inside `app/tests/unit`, Playwright e2e under `app/tests/e2e`. `turbo test` runs both.
- **Storybook**: lives under `app/.storybook`, imported components documented with MDX stories.
- **Husky Hooks**: `pre-commit` runs `turbo lint test --filter=...`; `pre-push` ensures e2e/test selection when necessary.
- **Documentation**: `docs/AGENTS.md` updated after each structural change; `docs/runbooks/*.md` for ops tasks (deploy, rollback, backup).

### 2.3 Automation Scripts
- `packages/scripts/src/setup.ts`: installs deps, copies `.env.example` → `.env.local`, spins up Dockerized Postgres/Azurite, runs migrations + seed.
- `packages/scripts/src/deploy.ts`: CLI that builds Docker image, pushes to ACR, updates App Service slot via Azure CLI.
- `packages/scripts/src/migrate.ts`: `pnpm scripts migrate --env production` runs Prisma migrations with safety checks (blocking if pending or drift).
- `packages/scripts/src/sync-content.ts`: migrates legacy Markdown into the new Contentlayer directories (no DB writes) and can be re-run idempotently for future imports.
- All scripts are TypeScript compiled with `ts-node` runtime to keep logic typed.

### 2.4 AGENTS.md Strategy
- `AGENTS.md` is treated as a living contract for automation. As part of the migration, we will rewrite it once work begins to cover:
  - Repository layout map (matching Section 2.1) with directory purposes.
  - Local development commands (`pnpm dev`, `docker compose up`, `pnpm scripts setup`, alias commands from `justfile`, tmux session helpers).
  - Toolchain requirements (Node, PNPM, Turbo, Docker, Azure CLI, Prisma, Playwright) with installation notes.
  - CI/CD overview (workflows, required checks, how to run locally).
  - Deployment process (Docker builds, ACR, App Service slots, Azure CLI commands).
  - Common troubleshooting steps (re-running migrations, clearing Contentlayer cache, authenticating with Azure CLI).
  - Security expectations (env var management, Key Vault usage, auth flows).
- It will also document Chrome DevTools / MCP usage: how to launch Playwright headed mode, how to open MCP-integrated Chrome for debugging, and the standardized tmux layout (`tmuxinator` config) for running multiple dev servers. These instructions will ensure agents can attach to DevTools, use local Chrome profiles, and interact with MCP-compatible tools consistently.
- `AGENTS.md` updates are part of Definition of Done for every structural change; CI enforces that file stays in sync by requiring manual review when touched.

### 2.5 Developer Tooling & Workflows
- **Chrome + DevTools**:
  - Standardize on Chrome Stable + Chrome DevTools Protocol for debugging. Document how to launch `pnpm dev --inspect` and connect via `chrome://inspect`.
  - Provide a `scripts/open-devtools.ts` helper that opens the local site plus React DevTools, Redux DevTools, and Lighthouse side panels.
  - Include instructions for capturing performance traces, network throttling, accessibility audits, and using Chrome Recorder for reproducible Playwright scripts.
- **MCP (Model Context Protocol) Integrations**:
  - Expose key endpoints (content metadata, build commands, telemetry) via MCP resources so AI agents can query repo state without shelling out.
  - Document MCP server endpoints in AGENTS.md, including authentication tokens and scopes.
  - Ensure CI publishes derived artifacts (Contentlayer schema, Prisma types) as MCP resources for downstream automation.
- **tmux/Tmuxinator Setup**:
  - Commit a `tmuxinator.yml` (or `tmuxp` config) that spawns panes for `pnpm dev`, `docker compose up db`, `pnpm contentlayer build --watch`, `pnpm test --watch`, and Azure CLI session.
  - Provide `scripts/dev-tmux.sh` to bootstrap the session; document state restoration so agents can reattach to `tmux new -s klaboworld`.
  - Encourage use of tmux for long-running watchers on remote hosts/CI, ensuring logs remain accessible.
- **Chrome Remote Debugging for Mobile**:
  - Document using Chrome DevTools Device Mode, plus `adb reverse` setup if mobile emulators are used.
- **Playwright Inspector**:
  - Provide `pnpm playwright test --ui` instructions and integrate with tmux layout for quick debugging.
- **Lighthouse CI**:
  - Add `pnpm lighthouse:ci` script plus local instructions for capturing budgets; integrate results into DevTools workflow.

### 2.6 Domain Modules & Data Flow
- **Public Web** (`app/(public)`): home/posts/apps/context routes using React Server Components; pulls MDX + JSON front matter exclusively from Contentlayer (file-first) and only reaches Postgres for ancillary needs (sessions, telemetry). Next.js ISR revalidates slugs every 10 minutes to avoid extra rebuild scripts.
- **Admin Surface** (`app/(admin)`): server actions handle CRUD. Forms call `lib/auth.ts` for session checks, `lib/storage.ts` to mint SAS uploads, and `lib/github.ts` to push commits via GitHub just like today.
- **Shared Libraries** (`app/lib`):
  - `db.ts` exports a singleton Prisma client with connection pooling tuned for App Service limits (≤5 connections per instance) with hooks to switch to PgBouncer/Prisma Accelerate if load requires.
  - `content.ts` resolves MDX + fallback HTML for previews; includes transforms for gist/card components to preserve legacy embeds.
  - `telemetry.ts` wraps OpenTelemetry instrumentation for API routes/server actions.
  - `email.ts` (future) reserved for transactional notifications; stubbed until mail service is approved.
- **API Contracts**: `app/api/*` and `packages/types` describe inputs/outputs for contexts search, gist proxy, and admin mutations. Zod schemas and `@trpc/server` (v11.7.1, if adopted) guarantee parity with existing Vapor behaviors.
- **Error Handling**: each route includes typed error boundaries returning fallback Leaf-equivalent templates; logging flows through `lib/logger.ts` to App Insights with correlation IDs.
- **Caching Strategy**: Redis/Azure Cache is not required initially; Next.js ISR is sufficient. Should we need background rebuilds, a `packages/scripts/src/revalidate.ts` job triggered via Azure Functions will call Next.js revalidation webhooks.

### 2.7 Feature Parity & Acceptance Checklist
1. **Posts** – Markdown import, tag filtering, next/previous navigation, gist embeds, highlight.js (v11.11.1) toggle, sitemap entries.
2. **Apps** – JSON/MDX hybrid data, icon streaming, screenshot galleries, optional store links.
3. **Contexts** – HTML + JSON endpoints, `/tags`, `/tag/:tag`, `/api/contexts/raw/:slug`, search (≥2 chars) with ranking identical to current Vapor implementation.
4. **Admin** – login rate limiting, password reset via CLI, post/app/context CRUD with preview + GitHub/Git sync logic, image uploads constrained to JPEG/PNG/GIF/WebP.
5. **Uploads** – Files land in Blob storage with SAS URLs; CDN served. Admin surfaces expose `cdn.klabo.world/<asset>` on success.
6. **Instrumentation** – `/api/health` route, OpenTelemetry spans for each major transaction, structured logs for admin write paths.
7. **Docs** – README, AGENTS.md, SECURITY_MIGRATION.md, DEPLOYMENT_CHECKLIST.md updated once each checkpoint above is completed; PR templates enforce linking to updated documentation.

### 2.8 Security Headers, Caching & Rate Limits
- Security headers (CSP, HSTS, X-Content-Type-Options) are defined via `next.config.ts -> headers()` so they apply uniformly across SSR, ISR, and route handlers. Helmet is **not** used.
- Rate limiting uses `rate-limiter-flexible` + Azure Cache for Redis to guarantee shared counters across App Service instances. Redis is provisioned as a P0 tier cache inside the VNet.
- CDN caching: Azure CDN fronts Blob + App Service; Next.js `draftMode` + server actions control busting.

### 2.9 Implementation Playbook (Step-by-Step)
To keep execution deterministic—and trivial for local dev—follow these ordered steps. Every step exposes a reproducible CLI command and associated verification.
1. **Bootstrap Workspace (`just bootstrap`)**
   - Command runs `corepack enable`, installs PNPM 10.22.0, writes `.nvmrc`/`.tool-versions`, and verifies `node -v` is ≥24.11.1.
   - Verification: `pnpm dlx envinfo --npmPackages pnpm,node` output saved under `docs/verifications/bootstrap.md`.
2. **Scaffold Next.js App**
   - `pnpm dlx create-next-app@16 app --ts --eslint --src-dir --app`.
   - Add `contentlayer.config.ts`, `content/` directories, and `tsconfig.json` path aliases.
   - Verification: `pnpm turbo lint` only warns about intentional TODOs; `pnpm dev` renders default page.
3. **Introduce Shared Packages + Reproducible Dev Shell (`just doctor`)**
   - Create `packages/config`, `packages/scripts`, optional `packages/ui`.
   - Commit `.devcontainer/devcontainer.json` referencing VS Code devcontainer (Node 24, PNPM, Postgres, Redis) so remote dev matches local.
   - Add `justfile` CLI wrappers:
     ```
     bootstrap: corepack enable && pnpm i -w pnpm@10.22.0 && pnpm install
     dev: docker compose up -d db redis azurite && pnpm dev
     test: pnpm turbo test
     lint: pnpm turbo lint
     doctor: pnpm dlx envinfo --system --binaries && docker compose ps
     ```
   - Verification: `just doctor` passes on macOS/Linux and inside devcontainer; results stored in `docs/verifications/doctor.md`.
4. **Wire Prisma + Auth (`just db-reset`)**
   - Scaffold `app/prisma/schema.prisma` with Admin, Session, RateLimiter tables.
   - `docker compose up -d db redis` ensures Postgres 17.6 + Redis 7.4 start with pinned images.
   - `pnpm prisma migrate dev --name init` + `pnpm prisma db seed`.
   - Verification: `pnpm vitest prisma.spec.ts` hits Prisma client, `pnpm prisma studio` lists tables, and `just db-reset` (which runs migrate + seed) exits 0 twice in a row.
5. **Port Content**
   - Run `pnpm tsx packages/scripts/src/export-legacy.ts`, commit generated MDX/JSON.
   - Verification: `pnpm contentlayer build` succeeds; `pnpm vitest content.spec.ts` ensures metadata parsing matches legacy fixtures.
6. **Build Admin Server Actions**
   - Implement login, CRUD, uploads using server actions backed by GitHub + Blob SAS.
   - Verification: Playwright suite `admin.spec.ts` passes locally and inside devcontainer (GitHub API mocked).
7. **Observability + DevEx**
   - Drop `instrumentation.ts`, `app/api/health/route.ts`, and OTel exporter wiring.
   - Add `scripts/open-devtools.ts`, tmux config, and MCP resource definitions.
   - Verification: `pnpm dev --inspect` discoverable via Chrome, App Insights shows sample span.
8. **Documentation Sync**
   - Update README, AGENTS.md, runbooks with every structural change; cross-link to modernization plan.
   - Verification: `pnpm lint:docs` (vale or markdownlint) passes and doc PR is reviewed.

### 2.10 Test-Driven & AI-Assisted Development
- **Default workflow = TDD**: every feature begins with a failing test (`pnpm vitest --runInBand` or `pnpm playwright test --list` targeting the new area). `just watch` spins up `pnpm vitest --watch` + `pnpm dev` concurrently so changes round-trip in seconds.
- **Template tests**: `packages/scripts/src/generate-test.ts` scaffolds Vitest + Playwright specs to enforce Arrange/Act/Assert plus fixture usage. No PR merges without a green test proving the change.
- **Coverage expectations**: `pnpm vitest run --coverage` must stay ≥80% lines for libraries; Playwright suite must cover at least one happy-path and one error path per admin surface. k6 smoke test runs nightly via `just load-test`.
- **AI agent enablement**:
  - `docs/AGENTS.md` documents devcontainer usage, Justfile commands, MCP endpoints (content schema, build logs, Prisma state).
  - MCP resources expose `package.json`, `turbo.json`, `infra/main.bicep`, recent CI logs, and verified commands (envinfo, doctor) so Codex/Claude agents can act deterministically.
  - `scripts/agent-context.sh` prints the repository mental model (dirs, commands, env vars) and is kept in sync with AGENTS.md after every structural change.
- **Local reproducibility for agents**: `just agent-shell` opens a tmux session containing `pnpm dev`, `pnpm vitest --watch`, `docker compose logs -f`, and `scripts/open-devtools.ts` so human + AI collaborators share the exact same pane layout/log stream.
- **Feature Definition of Done** now includes “tests written first, automation recorded” and “AGENTS.md updated if workflows changed,” ensuring future AI assistance keeps functioning.

---

## 3. Deployment & Operations Plan

### 3.1 Azure Infrastructure (Provisioned via Bicep)
- **Resource Group**: `rg-klaboworld-prod`.
- **Container Registry**: `acrklaboworld` (Premium SKU for geo-replication if needed).
- **App Service Plan (Linux)**: `asp-klaboworld` sized to handle Next.js SSR (initially P1v3).
- **Web App for Containers**: `app-klaboworld`, with deployment slot `staging`.
- **Azure Database for PostgreSQL Flexible Server**: `pg-klaboworld` (Zone-redundant, VNet integrated, automatic backups, PITR 7-30 days).
- **Storage Account**: `stklaboworld` with Blob containers:
  - `public-assets` – static uploads exposed via CDN.
  - `draft-uploads` – private staging area for admin previews.
- **Azure Cache for Redis**: `redis-klaboworld` (P0) used for rate limiting and any cross-instance coordination.
- **Azure CDN (Standard Microsoft)**: fronts Blob storage + App Service.
- **Key Vault**: `kv-klaboworld` storing secrets (DB conn string, NextAuth secret, email creds).
- **Application Insights**: `appi-klaboworld` connected to App Service.
- **Virtual Network**: `vnet-klaboworld` with subnets for App Service integration and private endpoints for Postgres, Storage, Key Vault, and Redis (rate limiting).
- **Private DNS Zones**: `privatelink.postgres.database.azure.com`, `privatelink.blob.core.windows.net`, etc., linked to the VNet so App Service resolves private endpoints correctly.
- **Front Door (optional)**: for global routing and WAF if traffic grows.

Provisioning workflow:
1. Define parameterized Bicep modules under `infra/modules` (including Private DNS zone records and Managed Identity role assignments).
2. Run `az deployment sub create --template-file infra/main.bicep --parameters @infra/envs/prod.json`.
3. Store outputs (resource IDs, connection strings) in GitHub Actions secrets.

### 3.2 Build & Deployment Pipeline

#### GitHub Actions Workflows
1. **`ci.yml`** (trigger: PR, push):
   - Checkout → restore PNPM store + Turbo cache (`actions/cache`) → `pnpm install --frozen-lockfile`.
   - Run `turbo lint test` with `--cache-dir=.turbo`.
   - `pnpm contentlayer build` to ensure MDX compiles.
   - `pnpm prisma migrate status --schema app/prisma/schema.prisma` to fail on drift.
   - Build the standalone output (`pnpm build`) and run Playwright against `pnpm start` (standalone server) so CI matches production behavior.
   - Upload test artifacts (coverage, Storybook static build) for review.

2. **`deploy.yml`** (trigger: push to `main`):
   - Reuse `ci` job steps.
   - Build Docker image using multi-stage Dockerfile (`node:24-slim` base for glibc compatibility, `pnpm install --frozen-lockfile`, `pnpm build`, copy `.next/standalone` + `.next/static` + `public/`).
   - Login to ACR using `azure/login@v2` + federated credentials.
   - Push image tagged with commit SHA and `latest`.
   - Run Prisma migrations against production DB via `pnpm prisma migrate deploy` (using `DATABASE_URL` from Key Vault secret).
   - Deploy container to staging slot using `azure/webapps-deploy@v3` referencing image `acrklaboworld.azurecr.io/klabo-next:${{ github.sha }}`.
   - Post-deploy smoke tests: `curl` `/api/health`, Playwright subset pointing to staging slot.
   - Swap staging → production slot if tests pass.
   - Notify via GitHub status + optional Teams/Slack webhook.

3. **`preview.yml`** (trigger: PR):
   - Build and deploy ephemeral preview using Vercel (for rapid review) + ephemeral Postgres (Neon) if heavy DB features need validation.
   - Report preview URL in PR comments.

#### Docker Container Entry Point
`start.sh` executed by App Service:
```bash
#!/usr/bin/env bash
set -euo pipefail
npx prisma migrate deploy
node server.js
```
- `server.js` generated by `next build` from `.next/standalone`.
- `PORT` environment variable consumed automatically.

### 3.3 Configuration & Secrets
- App Service app settings (via IaC): `DATABASE_URL` (Key Vault ref), `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `STORAGE_ACCOUNT_NAME`, `STORAGE_CONTAINER`, `AZURE_TENANT_ID`, `AZURE_CLIENT_ID` (managed identity), `BUILD_VERSION`, `BUILD_DATE`.
- Managed Identity assigned to App Service with roles:
  - Storage Blob Data Contributor on storage account.
  - Key Vault Secrets User on Key Vault.
  - (Optional) Monitoring Metrics Publisher for custom telemetry.
- `AZURE_CLIENT_ID`/`TENANT_ID` used in Next.js server components to request SAS tokens securely.

### 3.4 Content & Data Migration
1. Export existing Markdown posts/contexts/apps from `Resources/` using script `scripts/export-legacy.ts`.
2. Transform front matter → MDX front matter, store under `content/posts`, `content/apps`, `content/contexts`.
3. For app entries, normalize JSON data (icons/screenshots) and co-locate assets under `public/app-assets`.
4. Commit converted files to git; verify GitHubService (now TypeScript) can push commits to the repo or write locally in dev.
5. Verify rendering pipeline: Next.js pages read directly from Contentlayer output while admin previews reuse the same MDX parser—no Postgres writes take place during migration.

### 3.5 Testing & Hardening
- Unit tests for all libs (Vitest).
- Playwright e2e covering:
  1. Home page loads, shows posts/apps.
  2. Posts list + detail rendering, tag filtering.
  3. Contexts list, search API, contexts detail.
  4. Admin login, CRUD for posts/apps/contexts, image uploads (mock Blob).
- `k6` script hitting `/` and `/posts/[slug]` to check SSR throughput.
- Security scanning: `pnpm dlx snyk test`, `trivy image` on built container.
- Observability:
  - App Insights availability tests hitting `/api/health`.
  - Custom metrics (page generation time, queue length) exported via OpenTelemetry.
  - Alert rules for HTTP 5xx rate, response time, CPU/memory, database DTU, storage errors.

### 3.6 Cutover Procedure
1. Deploy new stack to production slot but keep old site live (different domain or same domain behind Front Door routing rule).
2. Run sync job to copy latest posts/apps/contexts.
3. Freeze content changes temporarily (announced downtime window).
4. Swap Front Door routing or DNS to point to new App Service.
5. Monitor logs, metrics for 24-48 hours.
6. If issues arise, swap back or roll out old container image via App Service deployment history.
7. Once stable, archive legacy repo, document new workflow in README + AGENTS.md.

### 3.7 Operational Runbooks
- **Deployment**: step-by-step commands for manual deploy (if CI unavailable), including `az acr build`, `az webapp config container set`, slot swaps.
- **Rollback**: revert to previous slot/image, re-run `prisma migrate revert` if necessary.
- **Database Recovery**: PITR instructions, connection rotation, verifying data integrity.
- **Storage Key Rotation**: script to rotate storage keys/SAS and update Key Vault references with zero downtime.
- **On-call Guide**: symptoms → dashboards/queries → remediation steps.
- **Cost Monitoring**: monthly review doc tracking App Service plan usage, DB compute, CDN bandwidth.

### 3.8 Environment Matrix & Support Lifecycle
- **Local** – Dockerized Postgres + Azurite; `pnpm dev` launches Next.js; developers validate migrations and MDX parsing before pushing.
- **Preview** – Vercel or container-based ephemeral env per PR with managed Postgres (Neon) seeded via `pnpm scripts setup --env preview`.
- **Staging** – Azure App Service slot with production-sized App Service Plan, private Postgres replica, and Blob container. Used for load/security tests, migration dry-runs, and accessibility reviews.
- **Production** – Azure App Service slot swapped only after staging smoke tests pass; governed by App Insights SLO dashboards (availability ≥ 99.5%, p95 latency < 600ms).
- **Support Commitments** – Weekly patch window for dependency updates, monthly chaos drill (storage failover, Postgres failover), quarterly disaster recovery rehearsal, and biannual review of Bicep/IaC state + security posture.

---

### 3.9 Migration Phasing
1. **Phase 0 – Decision Freeze**: lock the MDX/GitHub SoT, finalize Prisma schema for auth + rate limiting, and confirm Redis/Bicep resources exist before writing new code.
2. **Phase 1 – Public Parity**: ship the Next.js public site reading MDX while Vapor still powers admin. Verify posts/apps/contexts/search/uploads match production and exercise CDN caching + ISR.
3. **Phase 2 – Admin Cutover**: replace Vapor admin with Next.js server actions (Credentials auth, Redis rate limiting, Blob uploads via SAS, GitHub commits) and keep staging slot soaking while load/k6 tests run.
4. **Phase 3 – Production Swap**: deploy via staging slot, run entrypoint migrations + smoke tests, then swap Front Door/DNS. Keep the previous container image + Vapor site ready for rollback.

### 3.10 Confidence Checkpoints & Dry Runs
To guarantee “one-chance” success, enforce the following checkpoints before and during rollout:
1. **IaC Dry Run** – `az deployment sub what-if --template-file infra/main.bicep --parameters @infra/envs/prod.json` produces zero destructive changes; output reviewed/checked in.
2. **CI Fidelity** – GitHub Actions workflow executed on a clean fork (no caches) to ensure bootstrap instructions alone succeed; artifacts archived for reference.
3. **Container Parity Test** – Build image via `docker build -f Dockerfile .` locally, run `docker run -p 8080:3000 image` and execute the entire Playwright suite against it; proves the entrypoint/migrations behave identically to App Service.
4. **Staging Readiness Review** – Documented evidence that:
   - `pnpm prisma migrate deploy` ran in staging without pending migrations.
   - App Insights metrics (availability, latency) meet SLO for 48h.
   - Manual QA checklist (posts/apps/contexts/admin flows, image uploads, search) signed off.
5. **Rollback Drill** – Prior to prod swap, execute `az webapp deployment slot swap --slot staging --target-slot production --action preview` twice to ensure promo/demotion works and capture commands in runbook. Also rehearse re-deploying the previous container image (tag stored in GitHub release) and confirm `pnpm prisma migrate revert --to <last>` works on staging copy.
6. **Cutover Command Sheet** – Prepare a single `docs/runbooks/cutover.md` listing exact CLI commands (with resource names/subscriptions) for swap, DNS update, and rollback. Operator must dry-run each command with `--what-if`/`--dryrun` options where available.
7. **Observability Smoke** – Immediately after swap, run `scripts/smoke.sh` (curl + k6 short run + Playwright subset) pointed at prod domain; do not declare victory until all pass.

---

## Appendix – Version Audit (2025-11-14 UTC)

| Tool / Package | Latest Version | Verification Source |
| --- | --- | --- |
| Node.js LTS | v24.11.1 | `curl https://nodejs.org/dist/index.json` |
| Next.js | 16.0.3 | `npm view next version` |
| TypeScript | 5.9.3 | `npm view typescript version` |
| React | 19.2.0 | `npm view react version` |
| Tailwind CSS | 4.1.17 | `npm view tailwindcss version` |
| PostCSS | 8.5.6 | `npm view postcss version` |
| shadcn-ui CLI | 0.9.5 | `npm view shadcn-ui version` |
| Radix Primitives | 1.2.4 | `npm view @radix-ui/react-slot version` |
| Zod | 4.1.12 | `npm view zod version` |
| Prisma | 6.19.0 | `npm view prisma version` |
| PostgreSQL (Azure Flexible GA) | 17.6 | Microsoft Learn – Supported versions of PostgreSQL |
| Contentlayer | 0.3.4 | `npm view contentlayer version` |
| `@mdx-js/mdx` | 3.1.1 | `npm view @mdx-js/mdx version` |
| `@azure/storage-blob` | 12.29.1 | `npm view @azure/storage-blob version` |
| NextAuth (`next-auth`) | 4.24.13 | `npm view next-auth version` |
| `@node-rs/argon2` | 2.0.2 | `npm view @node-rs/argon2 version` |
| `rate-limiter-flexible` | 8.2.1 | `npm view rate-limiter-flexible version` |
| PNPM | 10.22.0 | `npm view pnpm version` |
| Turbo (`turbo`) | 2.6.1 | `npm view turbo version` |
| ESLint | 9.39.1 | `npm view eslint version` |
| `@next/eslint-plugin-next` | 16.0.3 | `npm view @next/eslint-plugin-next version` |
| Prettier | 3.6.2 | `npm view prettier version` |
| Husky | 9.1.7 | `npm view husky version` |
| Vitest | 4.0.9 | `npm view vitest version` |
| `@testing-library/react` | 16.3.0 | `npm view @testing-library/react version` |
| `@playwright/test` | 1.56.1 | `npm view @playwright/test version` |
| `@storybook/react` | 10.0.7 | `npm view @storybook/react version` |
| k6 | v1.4.0 | `curl https://api.github.com/repos/grafana/k6/releases/latest` |
| `@opentelemetry/sdk-node` | 0.208.0 | `npm view @opentelemetry/sdk-node version` |
| Azure CLI | 2.79.0 | `curl https://api.github.com/repos/Azure/azure-cli/releases/latest` |
| Snyk | 1.1300.2 | `npm view snyk version` |
| Trivy | v0.67.2 | `curl https://api.github.com/repos/aquasecurity/trivy/releases/latest` |
| Renovate | 42.11.0 | `npm view renovate version` |
| `@trpc/server` | 11.7.1 | `npm view @trpc/server version` |
| highlight.js | 11.11.1 | `npm view highlight.js version` |

This appendix should be re-run (scripts/automation TBD) whenever the plan is updated to keep the dependency matrix current.

---

## 4. End-State Deliverables
1. **Monorepo checked in**, bootstrapped with Next.js, Prisma, Contentlayer, Tailwind, shadcn/ui, full lint/test tooling.
2. **Automated scripts** (`setup`, `deploy`, `migrate`, `sync-content`) completed and documented.
3. **Azure infrastructure provisioned** via IaC; secrets stored in Key Vault; App Service + Postgres + Storage live.
4. **CI/CD workflows** (ci/deploy/preview) green and required for merges.
5. **Containerized app** running in staging + production slots with health checks and monitoring.
6. **Data migrated** from legacy posts/apps/contexts into the new MDX/JSON content tree (file-first) with Git-backed history.
7. **Docs & Runbooks** updated (README, AGENTS.md, operations manuals).
8. **Alerting** configured (App Insights, Azure Monitor).
9. **Load/security tests** recorded with acceptable thresholds met.
10. **Legacy stack decommissioned** with rollback plan archived.

Executing this plan verbatim ensures the new klabo.world is future-proof: dependencies curated and locked, codebase structured for AI and human contributors, and Azure deployment fully automated with clear operations guardrails. There are no placeholders or TBDs—every facet from dev onboarding to disaster recovery is accounted for. Once the plan is approved, implementation proceeds in the order described, with checkpoints after each major milestone.
