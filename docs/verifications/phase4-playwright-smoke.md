# Phase 4 – Playwright Smoke Verification

Date: 2025-11-14

## Scope

- Added Playwright 1.56 as a workspace dev dependency and installed browsers via `pnpm exec playwright install --with-deps`.
- Created `app/playwright.config.ts` with Chromium smoke project targeting `/tests/e2e`.
- Implemented smoke specs (`app/tests/e2e/home-smoke.e2e.ts` + `app/tests/e2e/admin-content.e2e.ts`) covering public pages plus an admin login/create/delete flow.
- CI workflow now brings up Postgres/Redis/Azurite, runs `pnpm --filter app build`, starts `pnpm --filter app start` in the background, and executes `pnpm --filter app exec playwright test --reporter=dot` against that server.

## Commands Run

1. `pnpm add -w -D @playwright/test playwright wait-on`
2. `cd app && pnpm exec playwright install --with-deps`
3. `docker compose -f docker-compose.dev.yml up -d db redis azurite`
4. `cd app && PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 pnpm exec playwright test`

## Notes

- Base URL is configurable via `PLAYWRIGHT_BASE_URL`; local runs default to `http://127.0.0.1:3000` from `playwright.config.ts`.
- Admin tests require Docker services plus `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXTAUTH_SECRET`, `DATABASE_URL`, `REDIS_URL`, `UPLOADS_DIR` to be exported (CI sets these automatically).
- GitHub Actions caches browsers per job, so `playwright install --with-deps` is required for every CI run (already scripted).
- CI now uploads `/tmp/next.log` and `app/test-results` as an artifact (`playwright-artifacts`) whenever the Playwright step fails, making it easy to download traces/logs from a failed run.
