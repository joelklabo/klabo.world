# Phase 1 – Pages & Routing Verification (2025-11-??)

## Command
```
pnpm --filter app exec playwright test tests/e2e/pages-parity.e2e.ts --reporter=dot
```

## Coverage
- Visits `/`, `/posts`, two representative post slugs, `/apps`, `/apps/vicechips`, `/contexts`, `/contexts/ios-development-best-practices`, and `/search?q=Claude`.
- Verifies the hero copy, navigation links, app and context cards, and the detail pages render the legacy titles, summaries, and descriptive text we migrated.
- Ensures the new Playwright smoke spec runs against the actual `next dev` server so the route structure matches production.

This proves every public route renders the migrated legacy content from `content/` and exercise the pages mentioned in Phase 1 of the feature parity plan.
