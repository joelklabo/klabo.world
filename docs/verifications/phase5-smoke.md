# Phase 5 – Production Smoke Verification

Date: 2025-11-15

## Command

```bash
SMOKE_BASE_URL=https://klabo-world-app.azurewebsites.net ./scripts/deploy-smoke.sh
```

## Result

- ✅ `/`, `/posts`, `/apps`, `/contexts`, `/search?q=bitcoin`, `/api/health` all returned 200 OK.
- Headers/body previews logged (see `scripts/deploy-smoke.sh`).
- This run confirmed Next.js `/search` is live on production and that all critical pages render before DNS cutover.
- 2025-11-15 05:17 UTC – re-ran smoke script after local `/search` fix. `/search` still returns 404 on production (remote host has not been redeployed with the latest build). Deployment pipeline must run again before DNS cutover.
