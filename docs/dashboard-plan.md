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

4. **Admin routes scaffolding**
   - Add `/admin/dashboards` index, `/admin/dashboards/new`, `/admin/dashboards/[slug]`.
   - Implement server actions for create/update/delete (using persistence helper).
   - Commit/push/verify.

5. **Log Analytics query helper**
   - Add server-side utility to call Log Analytics REST API (users per day, logs).
   - Store workspace ID/shared key in env (document requirements).
   - Commit/push/verify.

6. **Users-per-day chart**
   - Add KQL query (requests → unique users per day).
   - Build chart component (e.g., Recharts).
   - Wire `/admin/dashboards/[slug]` to render chart data from the query helper.
   - Commit/push/verify.

7. **Live logs / error list panel**
   - Add KQL query for warnings/errors.
   - Implement polling endpoint + UI in dashboard view (filters, search).
   - Commit/push/verify.

8. **Dashboard entry management UX**
   - Polish forms (tags, description, notes Markdown).
   - Add embed/link support (iframe vs. external link).
   - Commit/push/verify.

9. **Documentation & runbook updates**
   - Update AGENTS.md, runbooks, and README with instructions for dashboards/App Insights.
   - Commit/push/verify.
