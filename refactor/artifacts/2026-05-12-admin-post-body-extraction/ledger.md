# LOC Ledger — Centralized post body extraction

## Scope
- `app/src/lib/posts.ts`
- `app/src/app/posts/[slug]/page.tsx`
- `app/src/app/drafts/[slug]/page.tsx`

## Diff summary
- `app/src/lib/posts.ts`: 8 insertions, 0 deletions
- `app/src/app/posts/[slug]/page.tsx`: 5 insertions, 6 deletions
- `app/src/app/drafts/[slug]/page.tsx`: 5 insertions, 5 deletions
- Aggregate tracked delta: 18 insertions, 11 deletions (net `+7`)

## Notes
- Net LOC delta is positive due the new shared helper being extracted from two inlined code blocks.
