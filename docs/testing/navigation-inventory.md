# Navigation Inventory and Selectors

Authoritative map for nav-related coverage. Keep this in sync when adding or renaming links so Playwright selectors remain stable.

## Public navigation (header)
- `global-nav-home` → `/`
- `global-nav-writing` → `/posts`
- `global-nav-projects` → `/projects`
- `global-search-input` opens results container `global-search-results` (minimum query length handled server-side).

## Admin navigation (header, authenticated)
- Nav container: `admin-nav`
- Links:
  - `admin-nav-dashboard` → `/admin`
  - `admin-nav-compose` → `/admin/compose`
  - `admin-nav-apps` → `/admin/apps`
  - `admin-nav-dashboards` → `/admin/dashboards`
- Auth controls: login form test IDs (`admin-login-form`, `admin-login-email`, `admin-login-password`, `admin-login-submit`); after login expect “Sign out” button.

## Test reference
- Playwright spec: `app/tests/e2e/navigation.e2e.ts`
- Default creds injected via Playwright config: `ADMIN_EMAIL=admin@example.com`, `ADMIN_PASSWORD=change-me`, `NEXTAUTH_SECRET=test-secret` (when `PLAYWRIGHT_BASE_URL` unset).
