# Isomorphism Card — Centralize post publish date resolution

## Change
- Exported `getPostPublishDate(post)` from `app/src/lib/posts.ts`.
- Replaced duplicated `publishDate ?? date` / `new Date(...` publish date resolution in:
  - `app/src/lib/feed.ts`
  - `app/src/app/sitemap.ts`
  - `app/src/app/posts/[slug]/page.tsx`

## Equivalence contract
- **Inputs covered:** feed items, sitemap entries, and public post page metadata/json-ld.
- **Behavior preserved:** published timestamp is derived from the same values with identical fallback precedence (`publishDate` before `date`).
- **Date representation:**
  - `feed` and `post` metadata keep ISO string emission via `.toISOString()`.
  - sitemap keeps `Date` output via `Date` object from helper.
- **Error semantics / ordering / side effects:** unchanged.

## Verification
- [x] Confirmed all duplicated inline publish-date fallback logic moved to helper callsites.
- [x] Confirmed no behavioral changes in call ordering or sort/filter logic that depend on publication dates.
