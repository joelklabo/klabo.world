# Observability & Application Insights Runbook

This guide explains how klabo.world emits telemetry via OpenTelemetry + Azure Monitor and how to verify/operate the pipeline in each environment.

## Architecture Overview
- `app/instrumentation.ts` runs in Next.js' instrumentation hook. When `APPLICATIONINSIGHTS_CONNECTION_STRING` is defined, it bootstraps `@opentelemetry/sdk-node` using `AzureMonitorTraceExporter` and `getNodeAutoInstrumentations()`.
- Custom spans are emitted via `app/src/lib/telemetry.ts::withSpan()`—all admin server actions wrap persistence calls so you can trace CRUD events end-to-end.
- No traces/logs are exported when the connection string is missing, allowing silent local dev.

## Prerequisites
- Azure Application Insights resource (classic workspace or workspace-based). Copy its **Connection String** from the Azure Portal.
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
