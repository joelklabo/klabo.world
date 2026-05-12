# LOC Ledger — Admin slug helper non-nullability

## Scope
- `app/src/lib/adminPageHelpers.ts`
- `app/src/app/drafts/[slug]/page.tsx`

## Diff summary
- `app/src/lib/adminPageHelpers.ts`: 3 insertions, 3 deletions
- `app/src/app/drafts/[slug]/page.tsx`: 0 insertions, 8 deletions
- Total tracked delta: 3 insertions, 11 deletions (net `-8`)

## Notes
- This lever removes duplicate null handling at call sites and makes “resource is absent” behavior explicit in shared helper typing.
