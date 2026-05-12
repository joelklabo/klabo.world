# Verification Log — Centralize post hero fallback resolution

## Commands executed
- `rg -n "DEFAULT_POST_HERO_IMAGE" app/src/app/posts/page.tsx app/src/app/posts/[slug]/page.tsx app/src/lib/posts.ts`
- `git diff -- app/src/lib/posts.ts app/src/app/posts/page.tsx app/src/app/posts/[slug]/page.tsx`
