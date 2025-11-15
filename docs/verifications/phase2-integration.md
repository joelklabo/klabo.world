# Phase 2 – Integration Tests Verification (2025-11-16)

## Command
```
pnpm --filter app exec playwright test \
  tests/e2e/pages-parity.e2e.ts \
  tests/e2e/admin-content.e2e.ts \
  tests/e2e/admin-apps.e2e.ts \
  tests/e2e/admin-contexts.e2e.ts \
  tests/e2e/admin-dashboards.e2e.ts --reporter=dot
```

## Observations
- This suite combines the public page parity checks with the admin flows (content, apps, contexts, dashboards) to catch regressions across both the public site and the admin control panel in a single command.
- The dashboard test (`admin-dashboards.e2e.ts`) covers the dashboards CRUD, log/chart panels, and uploads so the telemetry/observability feature parity stays covered.

Running this combined job before marking Phase 2 complete ensures every route and admin workflow succeeds under the same testing harness used by CI.
