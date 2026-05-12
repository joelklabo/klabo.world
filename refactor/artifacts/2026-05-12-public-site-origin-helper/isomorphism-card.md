# Isomorphism Card — Centralize public site-origin extraction for OG routes

## Change
- Added `getPublicSiteOriginUrl()` to `app/src/lib/public-env.ts`.
- Replaced repeated origin construction in:
  - `app/src/app/og.png/route.ts`
  - `app/src/app/posts/[slug]/og.png/route.ts`

## Equivalence contract
- **Inputs covered:** both OG image routes for site and post pages.
- **Behavior preserved:** both handlers continue rendering the same origin host output used in the footer label.
- **Error semantics:** unchanged; fallback origin behavior still comes from existing site URL normalization in `getPublicSiteUrl()`.
- **Ordering / layout:** unchanged.

## Verification
- [x] Replaced duplicated `new URL(getPublicSiteUrl()) + pathname=''` pattern with one shared helper.
- [x] Updated render usage to consume the canonical string result without behavior-changing post-processing.
