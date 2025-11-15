# Phase 3 – Contexts API & Gist Proxy Verification

Date: 2025-11-14

## Scope

- Added `/api/contexts` (list), `/api/contexts/search`, `/api/contexts/:slug`, `/api/contexts/:slug/raw`, `/api/search`, `/api/tags`, `/rss.xml`, `/feed.json`, and `/api/gists/:username/:gistId`.
- Introduced `renderMarkdownPreview` reuse so API HTML matches admin previews/front-of-site rendering.
- Created helper utilities (`toContextMetadata`, `searchPublishedContexts`, `searchContent`, feed builders, etc.) plus Vitest coverage for metadata/search/feed behavior.
- Built `/search` page with inline form + results UI backed by the shared helper.

## Commands Run

1. `pnpm install`
2. `pnpm turbo lint`
3. `pnpm turbo test`

All commands succeeded (see CLI logs). Test suite now includes `app/tests/contexts.spec.ts`, `app/tests/search.spec.ts`, `app/tests/feed.spec.ts`, and the existing uploads/markdown preview specs.

## Notes

- API routes are `dynamic = 'force-dynamic'` to ensure fresh data after admin edits.
- Gist proxy forwards `GITHUB_TOKEN` when configured; GitHub username in the path is validated against the gist owner.
- `/api/search` mirrors legacy behavior (≥2 characters, max 10 records, prioritizes title matches) and the `/search` page consumes it server-side for parity.
- `/api/tags` powers the homepage tag cloud (posts + contexts + combined counts) with optional limit query.
- `/rss.xml` and `/feed.json` serve the latest posts with absolute URLs derived from `SITE_URL`; RSS is cached for 5 minutes.
