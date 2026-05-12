# Isomorphism Card — Remove redundant raw body destructuring

## Change
- Removed the unused `rawBody` binding from `app/src/app/posts/[slug]/page.tsx`:
  - `const { raw: rawBody, code: bodyCode, readingTime } = postBody;`
  - to `const { code: bodyCode, readingTime } = postBody;`

## Equivalence contract
- **Inputs covered:** public post detail page render path only.
- **Ordering preserved:** unchanged; same array/list operations and render order remain.
- **Error semantics:** unchanged; `notFound()` and `permanentRedirect()` branches unchanged.
- **Computation preserved:** `readingTime` and `bodyCode` values still come from the same `getPostReadableBody(post)` result.
- **Observable side effects:** none introduced.
- **Dead-store risk:** removed only an unused local binding (`rawBody`), no runtime behavior changed.

## Verification
- [x] Confirmed `rawBody` is not referenced after destructuring in this file.
- [x] Confirmed no other render logic changed in `app/src/app/posts/[slug]/page.tsx`.
