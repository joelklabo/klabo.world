# Admin Dashboards Implementation Plan

Each task below must be completed in order. For every task, commit the changes, push to `main`, and wait for CI + deploy workflows on GitHub to finish successfully before starting the next task.

1. **Provision Application Insights** ✅ (2025-11-15)
   - Created `klabo-world-admin` in `westus` via `az monitor app-insights component create ...`.
   - Stored the connection string in App Service (`APPLICATIONINSIGHTS_CONNECTION_STRING`) and documented setup in the observability runbook (remember to add it to your local `.env` when needed).
   - ✔️ Committed/pushed after documenting.

2. **Instrument Next.js with new Insights key** ✅ (2025-11-15)
   - `app/instrumentation.ts` now reads the connection string via the shared Zod env loader (`env.APPLICATIONINSIGHTS_CONNECTION_STRING`), so telemetry honors typed/validated env vars in every environment.
   - No behavior change when the string is missing—telemetry still no-ops locally—but this enforces a single source of truth for env configuration and keeps TypeScript happy.
   - ✔️ Committed/pushed after verifying CI.

3. **Define Dashboard Contentlayer schema** ✅ (2025-11-15)
   - Added `content/dashboards/*.mdx` (front matter + Markdown notes) with an App Insights example.
   - Contentlayer now exposes `DashboardDoc`, and helper utilities (`app/src/lib/dashboards.ts`) load/sort dashboard entries.
   - Implemented `dashboardPersistence.ts` mirroring the posts helper so admin CRUD can write MDX files locally or via GitHub.
   - ✔️ Committed/pushed after CI passed.

4. **Admin routes scaffolding** ✅ (2025-11-15)
   - Added `/admin/dashboards`, `/admin/dashboards/new`, and `/admin/dashboards/[slug]` with the shared `DashboardForm`.
   - Implemented server actions (create/update/delete) calling `dashboardPersistence` and wrapped them with telemetry + `requireAdminSession`.
   - Updated the admin layout navigation and added basic field validation (title + summary required, tags parsing, numeric refresh intervals).
   - ✔️ Committed/pushed after lint + CI.

5. **Log Analytics query helper** ✅ (2025-11-15)
   - Added `LOG_ANALYTICS_WORKSPACE_ID`/`LOG_ANALYTICS_SHARED_KEY` env vars (documented in `.env.example`).
   - Implemented `app/src/lib/logAnalytics.ts` which signs requests with the shared key and exposes `runLogAnalyticsQuery`.
   - ✔️ Committed/pushed after lint + CI.

6. **Users-per-day chart** ✅ (2025-11-15)
   - Added `recharts` + a reusable `DashboardChart` client component.
   - Implemented `loadDashboardChartState` to run KQL via `runLogAnalyticsQuery`, normalize series data, and surface friendly error states.
   - `/admin/dashboards/[slug]` now renders a live chart preview (with refresh badges + status messaging) for any chart panel with a KQL query.
   - ✔️ `pnpm --filter app lint` + `pnpm --filter app test` prior to commit and CI pass.

7. **Live logs / error list panel** ✅ (2025-11-15)
   - Added `content/dashboards/app-insights-live-logs.mdx` (panelType `logs`) with a union traces/exceptions KQL query.
   - Implemented `loadDashboardLogs` + `/admin/dashboards/[slug]/logs` API to fetch/filter entries (search + severity).
   - Created `DashboardLogsPanel` client component with polling + manual refresh + inline filters, surfaced inside `/admin/dashboards/[slug]`.
   - ✔️ Validated via lint/tests + CI.

8. **Dashboard entry management UX** ✅ (2025-11-15)
   - Dashboard form now includes helper text, Markdown previews/uploads for notes, and explicit guidance for tags + panel types.
   - Server actions validate panel-type requirements (charts/logs require KQL, embeds require iframe URLs, links require external URLs) and clear irrelevant fields.
   - Detail pages render live iframe/link previews so embed + CTA panels behave consistently with charts/logs.
   - ✔️ Lint/tests + CI enforced via `gh-commit-watch`.

9. **Documentation & runbook updates**
   - Update AGENTS.md, runbooks, and README with instructions for dashboards/App Insights.
   - Commit/push/verify.
