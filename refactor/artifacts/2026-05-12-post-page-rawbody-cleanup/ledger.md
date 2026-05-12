# LOC Ledger — Remove redundant raw body destructuring

## Scope
- `app/src/app/posts/[slug]/page.tsx`

## Diff summary
- `app/src/app/posts/[slug]/page.tsx`: 0 insertions, 1 deletion
- Aggregate tracked delta: 0 insertions, 1 deletion (net `-1`)

## Notes
- Net LOC reduction is expected and intentional; behavior is isomorphic because `rawBody` was never used.
