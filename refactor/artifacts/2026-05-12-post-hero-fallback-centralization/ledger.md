# LOC Ledger — Centralize post hero fallback resolution

## Scope
- `app/src/lib/posts.ts`
- `app/src/app/posts/page.tsx`
- `app/src/app/posts/[slug]/page.tsx`

## Diff summary
- `app/src/lib/posts.ts`: 7 insertions, 0 deletions
- `app/src/app/posts/page.tsx`: 4 insertions, 2 deletions
- `app/src/app/posts/[slug]/page.tsx`: 8 insertions, 3 deletions
- Aggregate tracked delta: 19 insertions, 5 deletions (net `+14`)

## Notes
- Net LOC increase is accepted for this extraction because a single shared fallback behavior now replaces duplicated literals in two call sites.
