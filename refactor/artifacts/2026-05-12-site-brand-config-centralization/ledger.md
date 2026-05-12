# LOC Ledger — Centralize shared site constants and identity-derived literals

## Scope
- `app/src/lib/site-config.ts`
- `app/src/lib/public-env.ts`
- `app/src/app/layout.tsx`
- `app/src/app/pay/page.tsx`
- `app/src/app/pay/payment-page-client.tsx`
- `app/src/app/posts/[slug]/page.tsx`
- `app/src/app/posts/[slug]/og.png/route.ts`
- `app/src/app/posts/[slug]/opengraph-image.tsx`
- `app/src/app/api/tip-stats/route.ts`
- `app/src/app/api/lnurlp/[username]/invoice/route.ts`
- `app/src/app/components/footer.tsx`
- `app/src/app/components/global-navigation.tsx`

## Diff summary
- `app/src/lib/site-config.ts`: 16 insertions, 0 deletions
- `app/src/lib/public-env.ts`: 7 insertions, 2 deletions
- `app/src/app/layout.tsx`: 30 insertions, 26 deletions
- `app/src/app/pay/page.tsx`: 10 insertions, 7 deletions
- `app/src/app/pay/payment-page-client.tsx`: 10 insertions, 4 deletions
- `app/src/app/posts/[slug]/page.tsx`: 2 insertions, 2 deletions
- `app/src/app/posts/[slug]/og.png/route.ts`: 4 insertions, 5 deletions
- `app/src/app/posts/[slug]/opengraph-image.tsx`: 2 insertions, 2 deletions
- `app/src/app/api/tip-stats/route.ts`: 2 insertions, 2 deletions
- `app/src/app/api/lnurlp/[username]/invoice/route.ts`: 2 insertions, 2 deletions
- `app/src/app/components/footer.tsx`: 5 insertions, 5 deletions
- `app/src/app/components/global-navigation.tsx`: 2 insertions, 2 deletions
- Aggregate tracked delta: 90 insertions, 67 deletions (net `+23` after adding a new shared config module)

## Notes
- The new module is additive and reduces repeated literals across backend and frontend surfaces.
