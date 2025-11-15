# Phase 5 – Production Smoke Verification

Date: 2025-11-15

## Command

```bash
SMOKE_BASE_URL=https://klabo-world-app.azurewebsites.net ./scripts/deploy-smoke.sh
```

## Result

- ✅ `/`, `/posts`, `/apps`, `/contexts`, `/search?q=bitcoin`, `/api/health` all returned 200 OK (latest run 2025-11-15 05:30 UTC).
- Headers/body previews logged (see `scripts/deploy-smoke.sh`).
- This run confirmed Next.js `/search` is live on production and that all critical pages render before DNS cutover.
- 2025-11-15 05:17 UTC – interim run failed because `/search` still returned 404 on production (stale container). Resolving by shipping commit `f5f041a` via the deploy workflow restored parity.
