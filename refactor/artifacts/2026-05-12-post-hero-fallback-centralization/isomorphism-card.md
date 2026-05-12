# Isomorphism Card — Centralize post hero fallback resolution

## Change
- Added `DEFAULT_POST_HERO_IMAGE` and `getPostHeroImage(post)` in `app/src/lib/posts.ts`.
- Replaced duplicated local hero fallback expressions in:
  - `app/src/app/posts/page.tsx`
  - `app/src/app/posts/[slug]/page.tsx`

## Equivalence contract
- **Inputs covered:** post index and public post detail pages.
- **Behavior preserved:** when a post has no `featuredImage`, both pages continue to resolve to `/images/posts/klabo-world-editorial-hero.webp`.
- **Ordering preserved:** no ordering changes in data fetch, slug handling, or rendering sequence.
- **Error semantics:** unchanged.
- **Computation preserved:** hero URL and downstream metadata/url rendering are computed from the same `post` object, only centralized through a single helper.
- **Side effects:** none added.

## Verification
- [x] Confirmed local string fallback constant was duplicated in both post entry points.
- [x] Confirmed both pages now call `getPostHeroImage(post)`.
- [x] Confirmed no extra hero fallback logic was introduced.
