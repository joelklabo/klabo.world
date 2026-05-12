# Isomorphism Card — Centralize readable post body extraction

## Change
- Added `getPostReadableBody` to `app/src/lib/posts.ts` to centralize:
  - body/code extraction
  - missing-body guard
  - reading time calculation
- Replaced duplicated inline extraction + guard logic in:
  - `app/src/app/posts/[slug]/page.tsx`
  - `app/src/app/drafts/[slug]/page.tsx`

## Equivalence contract
- **Inputs covered:** post detail page and draft preview page render paths.
- **Ordering preserved:** unchanged, no ordering logic changed for rendering.
- **Error semantics:** unchanged for missing body/code (`notFound()` in both routes is still called through unchanged control flow).
- **Computation preserved:** reading time still uses `Math.max(1, Math.round(wordCount / 200))` and body split logic remains identical.
- **Observable side effects:** none introduced.

## Verification
- [x] Verified both call sites now call `getPostReadableBody(post)` and retain their existing body-dependent render behavior.
- [x] Verified null-body paths still resolve to existing `notFound()` branches.
