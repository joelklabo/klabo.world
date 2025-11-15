# Phase 5 – Cutover Checklist

Use this checklist when promoting the Next.js site to become klabo.world’s primary deployment.

## Pre-Cutover
- [ ] Confirm latest commit deployed to `https://klabo-world-app.azurewebsites.net` (check `BUILD_VERSION` footer).
- [x] `pnpm turbo lint && pnpm turbo test` (Vitest) ✅ – 2025-11-15 05:13 UTC; see `docs/verifications/phase5-smoke-local.md`.
- [x] `PLAYWRIGHT_BASE_URL=https://klabo-world-app.azurewebsites.net pnpm --filter app exec playwright test` (or local equivalent) – 2025-11-15 05:12 UTC; results captured in `docs/verifications/phase5-smoke-local.md`.
- [x] `k6 run scripts/load-smoke.js` against production (recorded in `docs/verifications/phase5-load-test.md`).
- [x] `SMOKE_BASE_URL=https://klabo-world-app.azurewebsites.net ./scripts/deploy-smoke.sh` (see `docs/verifications/phase5-smoke.md`).
- [x] Visual spot check (`docs/verifications/phase5-visual-checks.md`) updated within last 24 hours (2025-11-15).
- [x] Confirm GitHub Content API creds (`GITHUB_TOKEN`, owner, repo) configured on App Service so admin edits persist to repo (verified via `az webapp config appsettings list --name klabo-world-app --resource-group klabo-world-rg` on 2025-11-15).

## DNS & Deployment
- [x] Export existing Azure Web App configuration (for rollback). Snapshot saved to `docs/azure/klabo-world-appsettings-2025-11-15.json`.
- [ ] Update DNS (or Azure Front Door/App Gateway) so `klabo.world` points to the Next.js App Service.
- [ ] Verify 200 responses at `https://klabo.world/` and `/search?q=bitcoin` (should match staging).
- [ ] Run deploy smoke + k6 smoke once DNS flips.

## Post-Cutover
- [ ] Notify stakeholders; link to release notes/verifications.
- [ ] Monitor Application Insights for 30 minutes (requests/errors).
- [ ] Freeze legacy Vapor App Service (stop or scale to zero) once confident.
- [ ] Mark legacy repo read-only / update README to point to the Next.js repo.

## Rollback Plan
- Re-point DNS/Front Door back to legacy App Service (ensure legacy app still healthy).
- If GitHub content diverged, re-run `pnpm --filter @klaboworld/scripts run export-legacy` to keep Contentlayer in sync before retrying cutover.
