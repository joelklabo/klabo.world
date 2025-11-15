# Phase 0 – Legacy Content Inventory (2025-11-15)

Commands were executed from repo root using the pinned toolchain.

## Counts & Structure

| Dataset | Command | Result |
| --- | --- | --- |
| Posts | `find Resources/Posts -type f -name '*.md' | wc -l` | 12 Markdown posts (plus a `.bak` duplicate for one file) |
| Contexts | `find Resources/Contexts -type f -name '*.md' | wc -l` | 2 Markdown context docs |
| Apps | `find Resources/Apps -type f -name '*.json' | wc -l` | 1 JSON app definition (`vicechips.json`) + associated icon assets |
| Uploaded images | `ls Public/uploads` | Multiple PNG/JPG files plus nested `apps/` directory (needs mapping when wiring uploads) |

## Metadata Observations

- Posts use front matter keys: `title`, `summary`, `date`, `publishDate`, `tags`, optional `featuredImage`. Body uses Markdown with inline images (`/images/...`) and embedded gists/YouTube links.
- Contexts front matter: `title`, `summary`, `createdDate`, `updatedDate`, `tags[]`, `isPublished`.
- Apps JSON schema includes: `name`, `slug`, `publishDate`, `version`, `icon`, `screenshots[]`, `features[]`, `fullDescription`, `githubURL`, `appStoreURL`.
- Legacy uploads live under `Public/uploads` (Vapor served via `FileMiddleware`). Azure deployment must ensure `${UPLOADS_DIR}` mirrors this.

## Action Items Captured

1. `packages/scripts/src/export-legacy.ts` needs to convert Markdown posts/contexts to `.mdx` but keep app JSON untouched (see open TODO).
2. Future migration should exclude `.bak` files and respect nested asset directories within `Resources/Apps` and `Public/uploads`.
3. Tag counts + featured image references must be generated during Contentlayer ingestion (Phase 1 task).

This inventory snapshot lives alongside other verification artifacts for auditability. Update it if new legacy content is added before migration completes.

