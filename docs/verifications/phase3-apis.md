# Phase 3 – Public APIs & Search Verification (2025-11-16)

## Command
```
pnpm --filter app exec playwright test tests/e2e/api-parity.e2e.ts --reporter=dot
```

## Observations
- `/api/contexts` returns metadata for every published context and the detail/raw endpoints for `ios-development-best-practices` include the expected markdown/HTML content.
- `/api/contexts/search?q=ios` returns a subset of contexts, matching the same `searchPublishedContexts` logic used by the admin UI.
- `/api/search?q=Claude` yields ≤10 combined results sorted by title/summary/tag relevance thanks to the `searchContent` scoring helper.
- `/api/tags?limit=5` demonstrates the `tagCloud` helpers aggregate post/context tags and respect the `limit` query parameter.
- `/api/health` returns `status: ok` plus the current timestamp/version for monitoring.
- `/api/gists/joelklabo/36cbd765b4a3a47c7a03cb2685de1162` proxies GitHub, returning the gist’s filename/content while handling the Authorization header per `env.GITHUB_TOKEN`.

Running this suite validates the public APIs and search/tag services required for Phase 3 platform parity.
