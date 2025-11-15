# klabo.world Feature Parity Plan

This document captures the detailed plan for translating every feature and piece of content from the legacy Vapor app into the modern Next.js stack. We will work through these phases sequentially, verifying at the end of each one that the new site matches or exceeds the legacy behavior.

---

## Phase 0 – Baseline & Content Source of Truth

1. **Inventory legacy content**
   - Run the legacy Swift app locally following `AGENTS.md` (legacy section).
   - Export `Resources/Posts`, `Resources/Apps`, `Resources/Contexts`, tag counts, and uploaded assets; record checksums or counts for later validation.
   - Document any custom front-matter fields or metadata currently used by the Leaf templates.

2. **Lock Node/PNPM + env reproducibility**
   - Ensure `mise` + `.tool-versions` provisioning is invoked via a `packages/scripts` helper so `just bootstrap` installs Node/PNPM automatically.
   - Confirm Docker Desktop/Colima instructions live in `AGENTS.md` and `README.md`; call out `docker compose` version requirements.

3. **Content migration scaffolding**
   - Extend or create a script (e.g., `packages/scripts/src/export-legacy.ts`) that copies the legacy content into `content/{posts,apps,contexts}` with front matter preserved.
   - Emit verification artifacts (e.g., row counts, sample diff snippets) into `docs/verifications/legacy-export.md`.

---

## Phase 1 – Front-of-site parity

1. **Contentlayer schema expansion**
   - Update `app/contentlayer.config.ts` to include every field used by the legacy site (featuredImage, publishDate, screenshots, context metadata, etc.).
   - Provide typed helpers: `getPosts`, `getApps`, `getContexts`, and tag aggregation utilities.

2. **Pages & routing**
   - Build routes with App Router + Contentlayer data:
     - `/` home page (hero, latest posts, featured apps, contexts summary, tag cloud).
     - `/posts`, `/posts/:slug`, `/posts/tag/:tag`.
     - `/apps`, `/apps/:slug`.
     - `/contexts`, `/contexts/tag/:tag`, `/contexts/tags`.
     - `/search` returning combined results with ≥2 character requirement and legacy sorting rules.
   - Bring over highlight.js toggle, Markdown/gist formatting, and previous/next post navigation.

3. **Styling + layout**
   - Port Tailwind tokens/utilities from `tailwind.input.css` (tag pills, highlight styles, skeletons).
   - Ensure layout matches `Resources/Views/base.leaf`: fonts, footer (build info, GA), navigation, and hero sections.

4. **Testing**
   - Add Vitest unit tests for data helpers/tag counts.
   - Add Playwright smoke tests covering `/`, `/posts`, `/apps`, `/contexts`.

**Exit criteria:** Public pages render all migrated content identically to the legacy site; smoke tests pass.

---

## Phase 2 – Admin & Auth parity

1. **NextAuth credentials + sessions**
   - Implement `/admin/login`, `/admin/logout`, and protected routes using Prisma adapter + rate limiter (port `RateLimiter.swift` logic).
   - Ensure Prisma schema includes Admin, Session, Account, RateLimitEntry tables.

2. **Admin CRUD**
   - Posts: list, create, edit, delete, Markdown preview, tag suggestions, publish toggle. Mirror GitHubService behavior (use GitHub API in production when token present, fall back to local FS otherwise).
   - Apps & Contexts: CRUD forms writing to `${UPLOADS_DIR}/{apps,contexts}` with screenshot uploads/reordering.

3. **Uploads**
   - `/admin/upload-image` route using Azure Blob Storage in production and local FS in development. Enforce MIME type/size validation identical to Vapor.

4. **Admin UI parity**
   - Recreate Leaf admin templates using App Router nested routes; include Markdown preview modal, context tags manager, screenshot galleries, etc.

5. **Integration tests**
   - Playwright flows: login → create post → preview → publish → search; uploads workflow.

**Exit criteria:** Admin flows enable full content management, GitHub-backed posts work, and e2e tests prove functionality.

---

## Phase 3 – API & Auxiliary Features

1. **Public APIs**
   - `/api/contexts` (HTML, JSON, raw, search variants) with same semantics as `ContextsController`.
   - `/api/gists/:username/:gistId` GitHub proxy.
   - `/api/health` returning build metadata and service status.

2. **Search service**
   - Implement shared search index builder mimicking `SearchResult.swift`, with server handler returning top 10 results prioritizing title matches.

3. **Tag cloud & caches**
   - Generate tag counts at build time via Contentlayer; provide incremental revalidation strategy for admin commits.

4. **RSS / Feeds (if the legacy site provided them)**
   - Implement feed routes (RSS/JSON) using Contentlayer output.

**Exit criteria:** All public APIs and feeds return the same data/format as the Vapor app.

---

## Phase 4 – Observability, Ops, & Parity Polish

1. **Application Insights / OTel**
   - Finalize `instrumentation.ts` with `@opentelemetry/sdk-node` + Azure Monitor exporter. Trace page routes and admin server actions.

2. **Secrets & environment management**
   - Move secrets (GitHub token, DB credentials) into Key Vault + GitHub Actions secrets; update deployment instructions.
   - Document fallback behavior when GitHub token missing (local-only mode).

3. **CI/CD enhancements**
   - Extend `ci.yml` to run Playwright (headed via xvfb) and capture artifacts on failure.
   - Add automated smoke test step after deploy (curl `/`, `/posts`, `/apps`) before marking success.

4. **Documentation**
   - Update `README.md`, `AGENTS.md`, `docs/modernization-plan.md`, and add runbooks under `docs/runbooks/` for admin workflows, backup, and recovery.

**Exit criteria:** Observability is wired, deployment pipeline enforces smoke tests, and docs cover new workflows.

---

## Phase 5 – Cutover & QA

1. **Data validation**
   - Compare a sample of pages between legacy and Next stack (visual diff or manual spot-checks).
   - Verify search/tag results match legacy counts.

2. **Performance & load**
   - Run `just load-test` (k6) against staging/production to validate App Service scaling.

3. **Stakeholder sign-off**
   - Demo to stakeholders, collect approvals, and make the Next.js app the canonical production deployment.
   - Freeze legacy Swift repo (read-only) once parity is confirmed.

**Exit criteria:** Stakeholders agree the new stack fully replaces the legacy app, and all runbooks/tests are in place.

---

### Working Agreements
- Each phase ends with passing `pnpm turbo lint test`, updated docs, and a verification artifact under `docs/verifications/`.
- Use `gh run list`, `gh run watch`, and `az webapp log tail` to monitor CI/CD and Azure health throughout the migration.
- Treat this file as the source of truth for feature-parity status; update it whenever scope or sequencing changes.

