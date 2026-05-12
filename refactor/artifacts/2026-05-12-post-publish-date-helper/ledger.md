# LOC Ledger — Centralize post publish date resolution

## Scope
- `app/src/lib/posts.ts`
- `app/src/lib/feed.ts`
- `app/src/app/sitemap.ts`
- `app/src/app/posts/[slug]/page.tsx`

## Diff summary
- `app/src/lib/posts.ts`: 4 insertions, 1 deletion
- `app/src/lib/feed.ts`: 2 insertions, 1 deletion
- `app/src/app/sitemap.ts`: 2 insertions, 1 deletion
- `app/src/app/posts/[slug]/page.tsx`: 3 insertions, 2 deletions
- Aggregate tracked delta: 11 insertions, 5 deletions (net `+6`)

## Notes
- Net increase is a tradeoff for deduplicating date resolution across feed, sitemap, and post detail metadata.
