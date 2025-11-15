# Observability & Application Insights Runbook

This guide explains how klabo.world emits telemetry via OpenTelemetry + Azure Monitor and how to verify/operate the pipeline in each environment.

## Architecture Overview
- `app/instrumentation.ts` runs in Next.js' instrumentation hook. When `APPLICATIONINSIGHTS_CONNECTION_STRING` is defined, it bootstraps `@opentelemetry/sdk-node` using `AzureMonitorTraceExporter` and `getNodeAutoInstrumentations()`.
- Custom spans are emitted via `app/src/lib/telemetry.ts::withSpan()`—all admin server actions wrap persistence calls so you can trace CRUD events end-to-end.
- No traces/logs are exported when the connection string is missing, allowing silent local dev.

## Prerequisites
- Azure Application Insights resource (classic workspace or workspace-based). We provisioned `klabo-world-admin` in `westus` on 2025‑11‑15 using:
  ```bash
  az monitor app-insights component create \
    --app klabo-world-admin \
    --location westus \
    --resource-group klabo-world-rg \
    --application-type web
  ```
  Grab the connection string anytime with:
  ```bash
  az monitor app-insights component show \
    --app klabo-world-admin \
    --resource-group klabo-world-rg \
    --query connectionString \
    -o tsv
  ```
- Push the string into App Service (already done once, rerun anytime after rotation):
  ```bash
  az webapp config appsettings set \
    --resource-group klabo-world-rg \
    --name klabo-world-app \
    --settings APPLICATIONINSIGHTS_CONNECTION_STRING="<string>"
  ```
- For local testing ensure Docker services are running (`just dev`) so admin workflows succeed.

## Enabling Telemetry
1. Set `APPLICATIONINSIGHTS_CONNECTION_STRING` in your environment:
   ```bash
   echo "APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=...;IngestionEndpoint=https://..." >> .env
   ```
2. Start the dev server (`just dev`). On boot you'll see `[otel] failed to start` logs if the connection string is invalid.
3. Trigger activity (load `/`, perform admin CRUD). Spans named `admin.post.create`, `admin.app.upsert`, etc., will be emitted automatically.
4. In production, add the connection string to the App Service configuration (`az webapp config appsettings set ...`). No code changes required.

## Verifying Telemetry
- **Local**: Run `pnpm --filter app dev` and watch terminal logs for warnings. If none, telemetry is active.
- **Azure**:
  ```bash
  az monitor app-insights query \
    --app <APP_INSIGHTS_NAME> \
    --analytics-query "traces | take 5"
  ```
  Replace `traces` with `requests`/`dependencies` as needed to inspect spans.
- Use the Azure Portal > Application Insights > Live Metrics or Transactions search to confirm traces carrying names like `admin.post.delete` and `GET /posts/[slug]`.

## Instrumenting New Code
1. For server actions / services, wrap logic with `withSpan('namespace.operation', async (span) => { ... })` from `app/src/lib/telemetry.ts`.
2. Set attributes on spans (e.g., slug, status) using `span.setAttributes({ 'context.slug': slug })`.
3. Avoid blocking front-end code with telemetry; `withSpan` already handles errors and ensures spans close even when exceptions bubble.

## Troubleshooting
- **No telemetry**: make sure `APPLICATIONINSIGHTS_CONNECTION_STRING` is defined in the environment of the running process (check `process.env` in `app/instrumentation.ts`). App Services require a restart after changing settings.
- **Version conflicts**: OTel auto-instrumentations may warn about `import-in-the-middle`/`require-in-the-middle` mismatches. Align versions in `package.json` if warnings escalate to errors.
- **Excess noise**: disable telemetry locally by removing/blanking the connection string; the instrumentation file bails out early.

Keep this runbook updated as we add logging/metrics/dashboards (e.g., when we wire in structured logging or Application Insights dashboards).

## Log Analytics Queries
- Set `LOG_ANALYTICS_WORKSPACE_ID` and `LOG_ANALYTICS_SHARED_KEY` (primary key) to unlock the helper at `app/src/lib/logAnalytics.ts`.
- `runLogAnalyticsQuery(query, { timespan })` signs the request with the shared key and POSTs to `https://api.loganalytics.io/v1/workspaces/<workspace>/query`. Use it from server actions when you need KQL results (users/day, error lists, etc.).
- Keep the shared key in App Service settings or Key Vault—never commit it. Local dev can omit it until you need live data.

### Managing Log Analytics credentials
1. List workspaces:
   ```bash
   az monitor log-analytics workspace list --resource-group klabo-world-rg -o table
   ```
2. Retrieve workspace ID + primary key:
   ```bash
   az monitor log-analytics workspace show \
     --resource-group klabo-world-rg \
     --workspace-name klabo-world-logs \
     --query customerId -o tsv
   az monitor log-analytics workspace get-shared-keys \
     --resource-group klabo-world-rg \
     --workspace-name klabo-world-logs \
     --query primarySharedKey -o tsv
   ```
3. Populate `LOG_ANALYTICS_WORKSPACE_ID` / `LOG_ANALYTICS_SHARED_KEY` (App Service settings + `.env` for local dev). Restart the app after updating production settings.

## Admin Dashboards
- Dashboard definitions live at `content/dashboards/*.mdx`. Admin CRUD routes (`/admin/dashboards/*`) read/write those files locally or via GitHub depending on environment.
- Panel types:
  - **Chart**: runs the stored KQL via `runLogAnalyticsQuery` and plots a Recharts line/area/bar chart (auto-detected metrics + timestamps).
  - **Logs**: hits `/admin/dashboards/[slug]/logs`, which proxies KQL results into a live list with severity badges, search, and auto-refresh intervals.
  - **Embed**: renders the configured iframe (Grafana, Azure Portal, etc.).
  - **Link**: shows a CTA button that opens `externalUrl` in a new tab (hostname shown on the button).
- Notes/runbooks (MDX body) render on the right-hand metadata card so responders can follow remediation steps.
- Validations:
  - Charts/logs require `kqlQuery` + Log Analytics credentials.
  - Embeds require `iframeUrl`.
  - Links require `externalUrl`.
  - The server action scrubs irrelevant fields before persisting to keep MDX tidy.
- Refresh timing is controlled by `refreshIntervalSeconds` (minimum 15 seconds enforced for auto-polling in the logs panel).

### Verifying Dashboards
1. Ensure `LOG_ANALYTICS_WORKSPACE_ID` / `LOG_ANALYTICS_SHARED_KEY` and `APPLICATIONINSIGHTS_CONNECTION_STRING` are configured (local `.env` or App Service settings).
2. Run the dev server (`just dev`) and visit `http://localhost:3000/admin/dashboards`. Confirm:
   - Chart panels render without error banners.
   - Logs panel lists entries and the manual **Refresh** button works.
   - Embed/link panels show the iframe/CTA.
3. If queries fail, inspect server logs for `Log Analytics query failed` errors—usually indicates expired shared keys or insufficient permissions.
4. After updating dashboard MDX, run `pnpm contentlayer build` (or rely on Next dev’s watch mode) to refresh the runtime graph.
