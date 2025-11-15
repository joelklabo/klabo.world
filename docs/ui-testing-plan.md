# UI Testing & Verification Plan

This initiative closes the gap between the automated Playwright smoke checks we already run and the level of UI confidence we expect before every release. The plan combines best practices from industry guidance (e.g., Cypress’s recommendations for stable selectors and purposeful waits [1] and Playwright’s guidance on parallelized, isolated tests with tracing [2]) with our domain-specific needs (admin workflows, static content rendering, and ensuring no production link ever references `localhost`).

## Goals
- Every critical flow—public pages, search, contexts APIs, admin CRUD (posts/apps/contexts/dashboards), uploads, and dashboards—has deterministic automated coverage.
- Tests run against both localhost (fast inner loop) and real hosts (`preview`, `staging`, `prod`) with the same code.
- A static link audit guarantees no `localhost` or other placeholder URLs leak into production builds.
- Manual exploratory passes on staging focus on regression-prone areas (Markdown rendering, external embeds, uploads) with documented checklists.
- Failures surface immediately in CI via GitHub Annotations + Playwright trace artifacts, and the deploy workflow is blocked until the suite passes.

## Phase 1 – Inventory & Instrumentation
1. **Feature coverage matrix** (commit: `docs/ui-coverage-matrix.md`). Enumerate routes + flows with columns for automated coverage, manual checklist, data dependencies.
2. **Test selectors** (code + docs): introduce `data-testid` attributes on interactive controls (per [1]) to avoid brittle CSS/xpath selectors. Update Playwright fixtures to prefer these selectors.
3. **Fixture data + seeding**: extend the existing SQLite seeding scripts (or future Postgres seeds) so each Playwright run starts from a known state. Provide helper to reset uploads dir + content caches before tests.

## Phase 2 – Automated Playwright Suite Expansion
1. **Configurable base URL**: `playwright.config.ts` now prefers `PLAYWRIGHT_BASE_URL` when you want to point at staging/production, and otherwise spins up its own dev server on `http://127.0.0.1:3100` with a dedicated SQLite database + `NEXTAUTH_URL` override so tests can run without touching whatever dev server (port 3000) you keep open for manual QA. (If you already have `pnpm dev` running, either stop it or set `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000` because Next.js only allows one dev instance per project at a time.)
2. **Public site specs**
   - Home/posts/apps/contexts/search page assertions (hero text, tag clouds, pagination).
   - Link audit: `await expect(page.locator('a[href*="localhost"])).toHaveCount(0)` and custom reporter that fails when any anchor or script URL contains non-production hosts.
   - Metadata checks: verify canonical URLs, OG tags, RSS endpoints respond `200`.
3. **Admin specs**
   - Posts/apps/contexts CRUD: create fixture content, assert GitHub/local files update, delete cleanup.
   - Dashboards: ensure charts/log panels render and poll endpoints.
   - Uploads: mock Azure storage in dev, then hit real staging container with throwaway assets, ensuring `https://` URLs are returned.
4. **Playwright features**
   - Enable `trace: 'retain-on-failure'`, `video: 'on-first-retry'`, and screenshot collection.
   - Run suites in parallel with sharding (`test.describe.configure({ mode: 'parallel' })`) as recommended in [2] to keep runtime acceptable.
   - Use soft assertions + `test.step` to isolate failures and provide readable logs.
5. **Static link crawler**
   - Add a script (e.g., `pnpm --filter app run audit:links`) that builds the site, walks `/app/.next/server/pages` HTML, and fails on `localhost` or other disallowed hosts. Wire it into CI before Playwright runs.

## Phase 3 – Manual / Exploratory Runs
1. **Staging checklist** (commit: `docs/runbooks/ui-exploratory.md`): responsive snapshots (mobile/desktop), Markdown preview parity, gist embeds, context raw endpoints, search debounce.
2. **Browser/device matrix**: run Chrome + Safari + Firefox latest on macOS (physical) once per release. Capture any anomalies in Jira/issue tracker.
3. **Session recording**: use Playwright Inspector or browser devtools recorder to capture traces for tricky bugs—store references alongside the checklist.

## Phase 4 – Reporting & Gating
1. **CI integration**
   - Extend `.github/workflows/ci.yml` to run the expanded suites on every PR (Fast subset) and on `main` (Full suite + link audit).
   - Publish Playwright HTML report + traces as artifacts on failure.
2. **Deploy workflow guard**
   - `deploy.yml` already calls `pnpm --filter app exec playwright test tests/e2e/admin-content.e2e.ts`. Replace that single spec with the new “release” suite tag (e.g., `--config playwright.release.config.ts --grep @release`).
3. **Live monitoring**
   - After each production deploy, run `scripts/deploy-smoke.sh` (HTTP checks) plus `pnpm exec playwright test --config playwright.prod.config.ts --project=chromium --max-failures=1` pointed at `https://klabo.world`. Alerts to Slack/Teams for any failure.

## References
[1] Cypress Documentation: “Best Practices”, https://docs.cypress.io/app/core-concepts/best-practices (stable selectors, avoiding brittle waits, etc.).

[2] Playwright Documentation: “Parallelism”, https://playwright.dev/docs/test-parallel (guidance on isolating tests, sharding, and keeping suites fast with tracing).
