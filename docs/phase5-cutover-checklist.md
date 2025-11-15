# Phase 5 – Cutover Checklist

Use this checklist when promoting the Next.js site to become klabo.world’s primary deployment.

## Pre-Cutover
- [x] Confirm latest commit deployed to `https://klabo-world-app.azurewebsites.net` (GH Actions run 19385057155 finished 2025-11-15 05:30 UTC; `/api/health` reports version `dev` from commit f5f041a).
- [x] `pnpm turbo lint && pnpm turbo test` (Vitest) ✅ – 2025-11-15 05:13 UTC; see `docs/verifications/phase5-smoke-local.md`.
- [x] `PLAYWRIGHT_BASE_URL=https://klabo-world-app.azurewebsites.net pnpm --filter app exec playwright test` (or local equivalent) – 2025-11-15 05:12 UTC; results captured in `docs/verifications/phase5-smoke-local.md`.
- [x] `k6 run scripts/load-smoke.js` against production (recorded in `docs/verifications/phase5-load-test.md`).
- [x] `SMOKE_BASE_URL=https://klabo-world-app.azurewebsites.net ./scripts/deploy-smoke.sh` (see `docs/verifications/phase5-smoke.md`).
- [x] Visual spot check (`docs/verifications/phase5-visual-checks.md`) updated within last 24 hours (2025-11-15).
- [x] Confirm GitHub Content API creds (`GITHUB_TOKEN`, owner, repo) configured on App Service so admin edits persist to repo (verified via `az webapp config appsettings list --name klabo-world-app --resource-group klabo-world-rg` on 2025-11-15).

## DNS & Deployment
- [x] Export existing Azure Web App configuration (for rollback). Saved locally via `az webapp config appsettings list --name klabo-world-app --resource-group klabo-world-rg` (gitignored JSON archives live under `docs/azure/`).
- [x] Update DNS (or Azure Front Door/App Gateway) so `klabo.world` points to the Next.js App Service. (Already active; verified host bindings via `az webapp config hostname list --resource-group klabo-world-rg --webapp-name klabo-world-app`.)
- [x] Verify 200 responses at `https://klabo.world/` and `/search?q=bitcoin` (should match staging). `SMOKE_BASE_URL=https://klabo.world ./scripts/deploy-smoke.sh` 2025-11-15 05:44 UTC.
- [x] Run deploy smoke + k6 smoke once DNS flips. `SMOKE_BASE_URL=https://klabo.world ./scripts/deploy-smoke.sh` + `LOAD_BASE_URL=https://klabo.world LOAD_VUS=5 LOAD_DURATION=30s k6 run scripts/load-smoke.js` (p95=408 ms) on 2025-11-15 05:44–05:48 UTC.

## Post-Cutover
- [x] Notify stakeholders; link to release notes/verifications. (See `docs/verifications/phase5-stakeholder-approval.md` – Joel signed off 2025-11-15.)
- [x] Monitor Application Insights for 30 minutes (requests/errors). (Captured in `docs/verifications/phase5-monitoring.md` – 05:44–06:14 UTC watch window.)
- [x] Freeze legacy Vapor App Service (stop or scale to zero). (No legacy App Service instances found via `az webapp list`; migration complete.)
- [x] Mark legacy repo read-only / update README to point to the Next.js repo. (README now states this repo is the authoritative Next.js stack; legacy Swift sources are reference only.)

## Rollback Plan
- Re-point DNS/Front Door back to legacy App Service (ensure legacy app still healthy).
- If GitHub content diverged, re-run `pnpm --filter @klaboworld/scripts run export-legacy` to keep Contentlayer in sync before retrying cutover.
