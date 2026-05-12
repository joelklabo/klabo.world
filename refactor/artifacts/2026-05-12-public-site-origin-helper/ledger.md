# LOC Ledger — Centralize public site-origin extraction for OG routes

## Scope
- `app/src/lib/public-env.ts`
- `app/src/app/og.png/route.ts`
- `app/src/app/posts/[slug]/og.png/route.ts`

## Diff summary
- `app/src/lib/public-env.ts`: 8 insertions, 0 deletions
- `app/src/app/og.png/route.ts`: 4 insertions, 4 deletions
- `app/src/app/posts/[slug]/og.png/route.ts`: 4 insertions, 4 deletions
- Aggregate tracked delta: 16 insertions, 8 deletions (net `+8`)

## Notes
- This step removes the last duplicated route-origin extraction used by OG image handlers.
