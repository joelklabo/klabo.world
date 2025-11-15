# UI Coverage Matrix

| Area / Flow | Description | Automated Coverage | Manual Checklist | Data Dependencies |
| --- | --- | --- | --- | --- |
| Home page | Hero content, latest posts/apps/contexts, tag cloud, footer links | ✅ (playwright `home.spec.ts`) | Responsive snapshots (mobile/desktop) | Needs ≥3 posts, ≥1 app, ≥1 context |
| Posts index | `/posts` pagination, tag filters | ✅ partial (`posts.spec.ts`) | Check highlight.js toggle, RSS link | Fixture posts + tags |
| Post detail | `/posts/:slug` markdown rendering, gist embeds, previous/next nav | ⚠️ missing gist + embed assertions | Manual preview vs. published | Post w/ gist + embed |
| Post tag listing | `/posts/tag/:tag` filtering + meta tags | ❌ | Verify canonical, tag pill counts | Tag-specific fixture |
| Apps index/detail | `/apps`, `/apps/:slug` icons, screenshots, store links | ⚠️ screenshot carousel untested | Manual check of external links | App JSON + image assets |
| Contexts index/detail | `/contexts`, `/contexts/:slug`, `/contexts/tag/:tag`, `/contexts/tags` | ⚠️ search constraints untested | Ensure raw markdown endpoint returns text/markdown | Context MDX fixtures |
| Search page | `/search` combined results, keyboard navigation | ⚠️ only smoke coverage | Manual: search ≤1 char blocked, highlight terms | Requires posts/apps/contexts data |
| Admin login/session | `/admin` credential auth, session cookie, logout | ✅ (`admin.auth.spec.ts`) | Manual cross-browser login | Admin credentials (env) |
| Admin posts CRUD | compose/edit/delete, markdown preview, GitHub writes | ⚠️ create/delete only | Manual: check preview + publish date guard | GitHub token (prod) or local FS |
| Admin apps CRUD | create/update apps, icon uploads | ❌ | Manual: verify screenshot ordering, store links | Uploads dir + JSON fixtures |
| Admin contexts CRUD | create/update contexts, tags, publish toggle | ❌ | Manual: context tags reorder, raw API preview | Uploads dir + MDX fixture |
| Admin dashboards | create/update chart/log/embed/link panels | ✅ (`admin-dashboards.e2e.ts`) | Manual: test KQL errors, log filtering | Log Analytics creds |
| Upload image helper | `/admin/upload-image` local + Azure | ⚠️ local coverage only | Manual: upload to staging blob, confirm CDN URL | Uploads dir / Azure Storage |
| Markdown preview | `/admin/markdown-preview` for posts/contexts | ✅ unit (Vitest) only | Manual: compare preview vs. published | Down/markdown fixtures |
| Public APIs | `/rss.xml`, `/feed.json`, `/api/contexts*`, `/api/search` | ⚠️ only unit tests | Manual: curl APIs in staging | Content data |
| Link audit | Ensure no anchor/script references `localhost` in production | ❌ | Manual scanning currently | build artifacts |
| Error states | 404 page, admin unauthorized, validation errors | ❌ | Manual finish | fixtures |
| External nav | Navbar/footer links to klabo.social, GitHub, etc. | ⚠️ not asserted | Manual: each link opens in new tab | n/a |
| Responsive layouts | Mobile nav toggle, hero stack, cards | ❌ | Manual via Device Mode | n/a |

Legend: ✅ = full automated coverage; ⚠️ = partial; ❌ = missing.

This table drives the phase-by-phase work described in `docs/ui-testing-plan.md`.
