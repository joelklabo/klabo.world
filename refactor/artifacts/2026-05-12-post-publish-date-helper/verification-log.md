# Verification Log — Centralize post publish date resolution

## Commands executed
- `rg -n "publishDate \\?\\? post\\.date|new Date\\(post\\.publishDate \\?\\? post\\.date\\)" app/src/lib/feed.ts app/src/app/sitemap.ts app/src/app/posts/[slug]/page.tsx app/src/lib/posts.ts`
- `git diff -- app/src/lib/posts.ts app/src/lib/feed.ts app/src/app/sitemap.ts app/src/app/posts/[slug]/page.tsx`
