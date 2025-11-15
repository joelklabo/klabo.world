# Phase 5 – Local Smoke Verification (Next dev server)

Date: 2025-11-15

## Commands

```bash
# vitest + Playwright
pnpm --filter app test
PLAYWRIGHT_BASE_URL=http://localhost:3000 ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=change-me \
  pnpm --filter app exec playwright test tests/e2e/admin-content.e2e.ts tests/e2e/admin-apps.e2e.ts tests/e2e/admin-contexts.e2e.ts

# Deploy smoke against dev server
SMOKE_BASE_URL=http://localhost:3000 ./scripts/deploy-smoke.sh

# k6 smoke against dev server
LOAD_BASE_URL=http://localhost:3000 LOAD_VUS=5 LOAD_DURATION=30s k6 run scripts/load-smoke.js
```

## Results
- Vitest (7 files / 14 tests) ✅
- Playwright admin workflows (posts/apps/contexts) ✅
- `scripts/deploy-smoke.sh` ✅ – all routes returned 200 locally.
- 2025-11-15 05:08 UTC – Re-ran `scripts/deploy-smoke.sh` after `/search` async fix; endpoints (/, /posts, /apps, /contexts, /search?q=bitcoin, /api/health) all returned 200.
- 2025-11-15 05:12 UTC – `pnpm turbo lint && pnpm turbo test` (Vitest) + `PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm --filter app exec playwright test` all passed post-fix.
- `k6` smoke ✅ – 0% failures, `http_req_duration p(95)=395ms`.

This confirms the local dev server behaves identically to the production staging host prior to cutover.
