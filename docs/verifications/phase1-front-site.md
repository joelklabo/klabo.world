# Phase 1 – Front-of-site Parity Snapshot (2025-11-15)

## Commands Executed

```bash
# Export legacy content into content/{posts,apps,contexts}
pnpm --filter @klaboworld/scripts run export-legacy

# Copy static assets used by Markdown into Next.js public dir
cp -R Public/images app/public/
cp -R Public/uploads app/public/
cp Resources/Apps/vicechips-icon.png app/public/app-icons/

# Validate Contentlayer schema + Next build
cd app && NODE_ENV=production pnpm contentlayer build
pnpm --filter app build
```

## Result Highlights

- **Contentlayer** now ingests 12 posts, 2 contexts, and the `vicechips` app JSON with computed `url` fields. Tags, publish dates, and featured images are all available to components.
- **Home page (`/`)**: hero section, latest posts grid, horizontal app showcase, contexts preview, and tag cloud.
- **Dedicated routes**:
  - `/apps`, `/apps/:slug`
  - `/contexts`, `/contexts/:slug`, `/contexts/tag/:tag`, `/contexts/tags`
  - `/posts/tags`, `/posts/tag/:tag`
- **Post detail** pages include publish date, summary, tag pills, and previous/next navigation.
- **Static assets** from the legacy `Public/` directory (images + uploads) are now served via `app/public/**`, so Markdown embeds resolve without broken links.

This document, plus the git history, serves as the verification artifact for Phase 1.
