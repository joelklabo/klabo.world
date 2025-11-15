# Phase 5 – Load Test Verification

Date: 2025-11-15

## Scope

- Added `scripts/load-smoke.js`, a k6 script that hits `/`, `/posts`, `/apps`, `/contexts`, `/search?q=bitcoin`, and `/api/health` to ensure basic availability under light concurrency.
- Updated `Justfile` `load-test` target to call `k6 run scripts/load-smoke.js` (requires the `k6` CLI; install via `brew install k6`).
- Documented the k6 dependency in `AGENTS.md`.

## Command

```bash
# run 1 (before enabling GET /search):
LOAD_BASE_URL=https://klabo-world-app.azurewebsites.net \
LOAD_VUS=5 \
LOAD_DURATION=30s \
k6 run scripts/load-smoke.js
# http_req_duration p(95)=382.87ms (PASS)
# http_req_failed   =16.66% (FAIL) – /search?q=bitcoin returned 404 on legacy host

# run 2 (after enabling Next.js /search on production):
LOAD_BASE_URL=https://klabo-world-app.azurewebsites.net \
LOAD_VUS=5 \
LOAD_DURATION=30s \
k6 run scripts/load-smoke.js
# http_req_duration p(95)=602.06ms (PASS)
# http_req_failed   =0.00%  (PASS)
```

Defaults (when env vars omitted) are `LOAD_BASE_URL=http://localhost:3000`, `LOAD_VUS=5`, `LOAD_DURATION=30s`, thresholds `http_req_failed < 1%` and `http_req_duration p(95) < 750ms`.

### Observations
- All public pages and `/api/health` responded 200 OK within the latency threshold.
- After deploying the Next.js `/search` endpoint to production, the 404s disappeared and thresholds now pass at 0% failure.

## Notes

- The script sleeps ~1s between endpoint hits to avoid overwhelming dev/staging.
- Extend `ENDPOINTS` inside `scripts/load-smoke.js` if new public routes need coverage.
- Run this against staging/production after deployments or before Phase 5 cutover to ensure App Service handles baseline load.
