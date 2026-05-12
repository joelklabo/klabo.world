# Isomorphism Card — Centralize shared site constants and identity-derived literals

## Change
- Added `app/src/lib/site-config.ts` containing canonical site/pay domain strings, descriptions, and namespace constants.
- Replaced duplicated literal values across frontend metadata and UI with imports from `site-config`:
  - `app/src/app/layout.tsx`
  - `app/src/app/pay/page.tsx`
  - `app/src/app/pay/payment-page-client.tsx`
  - `app/src/app/posts/[slug]/page.tsx`
  - `app/src/app/posts/[slug]/og.png/route.ts`
  - `app/src/app/posts/[slug]/opengraph-image.tsx`
- Centralized lightning namespace prefix consumption in:
  - `app/src/app/api/tip-stats/route.ts`
  - `app/src/app/api/lnurlp/[username]/invoice/route.ts`
- Updated shared public fallback URL source:
  - `app/src/lib/public-env.ts` now reads `SITE_CANONICAL_URL` from the new config.

## Equivalence contract
- **Inputs covered:** post metadata/OG fallback values, payment metadata values, pay page labels, namespace-prefixed comments.
- **Ordering preserved:** no iteration/order changes; only scalar string resolution source changed.
- **Error semantics:** unchanged.
- **External behavior:** preserved except for fallback-source refactoring:
  - public URL fallback still resolves to `https://klabo.world`.
  - all existing copy/content values remain byte-identical in generated output.
  - LNURL comment generation retains literal prefix semantics with shared constant alias.

## Verification
- [x] Deduplicated repeated literals with direct constant references.
- [x] Kept per-call behavior identical (prefix formats, URLs, brand strings, titles).
- [x] No route handlers changed aside from shared constant substitution.
