# Verification Log — Centralize public-site URL composition

## Commands executed
- `rg -n "absoluteUrl|withBaseUrl|getPublicSiteUrl|withPublicSiteUrl" app/src/lib/feed.ts app/src/app/sitemap.ts app/src/app/robots.ts app/src/lib/public-env.ts`
- `git diff -- app/src/lib/public-env.ts app/src/lib/feed.ts app/src/app/sitemap.ts app/src/app/robots.ts`
