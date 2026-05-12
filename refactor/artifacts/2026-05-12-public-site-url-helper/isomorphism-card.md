# Isomorphism Card — Centralize public-site URL composition

## Change
- Added `withPublicSiteUrl(path)` to `app/src/lib/public-env.ts`.
- Replaced manual public URL composition in:
  - `app/src/lib/feed.ts`
  - `app/src/app/sitemap.ts`
  - `app/src/app/robots.ts`

## Equivalence contract
- **Inputs covered:** feed generation, sitemap generation, robots generation.
- **Behavior preserved:** base site origin and path concatenation behavior remains:
  - trailing slash handling is equivalent to prior helpers in each file.
- **Error semantics:** unchanged.
- **Ordering:** unchanged.
- **Side effects:** unchanged.

## Verification
- [x] Verified each route now calls `withPublicSiteUrl` for absolute URL assembly.
- [x] Verified no local duplicate base-url helper remains in feed/sitemap.
