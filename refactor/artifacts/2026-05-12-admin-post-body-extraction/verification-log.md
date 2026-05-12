# Verification Log — Centralized post body extraction

## Commands executed
- `git diff -- app/src/lib/posts.ts app/src/app/posts/[slug]/page.tsx app/src/app/drafts/[slug]/page.tsx`
- `rg -n "getPostReadableBody|post.body\?\.raw|bodyCode|readingTime = Math.max" app/src/app/posts/[slug]/page.tsx app/src/app/drafts/[slug]/page.tsx`
- CI run for commit after push (`gh run view`): `257632xxxx` (queued as part of this push)
