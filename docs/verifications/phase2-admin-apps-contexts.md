# Phase 2 – Admin Apps & Contexts Verification

Date: 2025-11-14

## Scope

- Added `/admin/apps/new` and `/admin/apps/[slug]/edit` forms wired to `upsertAppAction`.
- Added `/admin/contexts/new` and `/admin/contexts/[slug]/edit` forms with publishing controls.
- Hardened server actions (`slugify`, ISO publish dates, newline tag parsing) and wired revalidation for `/`, `/apps`, `/contexts`, and `/contexts/tags`.
- Implemented `/admin/upload-image` (local filesystem + Azure Blob backends) plus reusable upload widgets inside post/app/context forms.

## Local Validation

1. `pnpm turbo lint`
2. `pnpm turbo test` (runs Vitest suites including `app/tests/uploads.spec.ts` + `app/tests/markdown-preview.spec.ts`)
3. `cd app && PLAYWRIGHT_BASE_URL=http://localhost:3000 ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=change-me pnpm exec playwright test tests/e2e/admin-content.e2e.ts tests/e2e/admin-apps.e2e.ts tests/e2e/admin-contexts.e2e.ts`

All commands ran successfully (see CLI logs in this PR). Playwright now covers create/edit/delete flows for posts, apps, and contexts end-to-end.

## Manual QA Checklist

Automated Playwright suites cover the flows below, but leave these items checked during any manual spot-check:

- [ ] Launch `pnpm --filter app dev`, log into `/admin`, and create a new app; confirm it renders on `/apps` and home. *(Automated by `admin-apps.e2e.ts`)*
- [ ] Edit an existing app and verify slug is preserved + features/screenshots persist. *(Automated by `admin-apps.e2e.ts`)*
- [ ] Create a new context (draft + published variants) and verify `/admin/contexts`, `/contexts`, and `/contexts/tags` update accordingly. *(Automated by `admin-contexts.e2e.ts`)*
- [ ] Delete a context/app and ensure it disappears everywhere plus GitHub/local files reflect the change. *(Automated by `admin-apps.e2e.ts` / `admin-contexts.e2e.ts`)*
- [ ] Use the Upload buttons to add a featured image/icon/screenshot and confirm the generated path works on the public site.

> Update this checklist as we complete each manual test run so future agents know the exact status.
