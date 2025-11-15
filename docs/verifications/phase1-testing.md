# Phase 1 – Testing Verification (2025-11-16)

## Commands
```
pnpm vitest run
pnpm --filter app exec playwright test \
  tests/e2e/pages-parity.e2e.ts \
  tests/e2e/admin-content.e2e.ts \
  tests/e2e/admin-apps.e2e.ts \
  tests/e2e/admin-contexts.e2e.ts \
  tests/e2e/admin-dashboards.e2e.ts --reporter=dot
```

## Observations
- Vitest covered the unit modules for auth, feed/search/tag-cloud helpers, uploads, and markdown preview (all 20 tests passed in under 1s). This ensures the helper logic referenced in the legacy plan remains stable.
- The Playwright suite runs the page parity spec plus the full admin flows (content, apps, contexts, dashboards). The pages parity spec verifies titles/summaries for the exported content, and the admin specs exercise login, CRUD, upload, and dashboard interactions on the running dev server.
- Combined, these suites deliver repeatable regression coverage for every public route and admin workflow described in Phase 1 of the feature parity plan.

Run them regularly (e.g., `pnpm vitest run && pnpm --filter app exec playwright test ...`) before marked major changes and capture new verification snapshots if new tests are added.
