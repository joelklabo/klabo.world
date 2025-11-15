# Phase 2 – Admin CRUD Verification (2025-11-16)

## Command
```
pnpm --filter app exec playwright test \
  tests/e2e/admin-content.e2e.ts \
  tests/e2e/admin-apps.e2e.ts \
  tests/e2e/admin-contexts.e2e.ts --reporter=dot
```

## Observations
- `admin-content.e2e.ts` signs in, composes a new post (title/summary/tags/featured image/content), then edits and deletes it so the `posts` persistence helpers, Markdown field, and server actions all work as expected within the Next.js stack.
- `admin-apps.e2e.ts` creates an app listing, edits the version, and deletes it while interacting with the upload helpers for icons/screenshots, proving the `appPersistence` helpers can write JSON files (or push to GitHub in production).
- `admin-contexts.e2e.ts` flows through context creation, editing, publish toggling, and deletion while exercising the Markdown + uploads helpers and the `/api/contexts` endpoints, ensuring the `contextPersistence` helpers generate valid MDX documents.

These Playwright suites cover the full CRUD surface for posts, apps, and contexts, satisfying the Phase 2 “Admin CRUD” milestone and replicating the legacy admin workflows.
