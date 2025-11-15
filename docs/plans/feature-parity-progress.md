# Feature Parity Progress

This tracking doc augments `docs/plans/feature-parity.md` by breaking the remaining phases into actionable to-dos. Each entry references the original section in the feature parity plan and tracks status as we progress through Phase 0 → Phase 4.

## Phase 0 – Baseline & Content Source of Truth
| Task | Notes | Status |
| --- | --- | --- |
| Inventory legacy content | Reference counts from `docs/verifications/phase0-inventory.md`. Need to ensure exported files match counts before migration. | ✅ (verified) |
| Lock Node/PNPM + env reproducibility | Already addressed via `just bootstrap` and the inventory doc. | ✅ |
| Content migration scaffolding | `packages/scripts/src/export-legacy.ts` now parses front matter and enforces required keys before exporting files, providing greater confidence that the migrated MDX files match the legacy metadata. Export command verified in `docs/verifications/legacy-export.md`. | ✅ |

## Phase 1 – Front-of-site parity
| Task | Notes | Status |
| --- | --- | --- |
| Contentlayer schema expansion | `app/contentlayer.config.ts` defines all legacy fields plus dashboards and verification ensured via `pnpm --filter @klaboworld/scripts run verify-contentlayer` documented in `docs/verifications/contentlayer-schema.md`. | ✅ |
| Pages & routing | Public routes now have a Playwright smoke suite (`tests/e2e/pages-parity.e2e.ts`) that loads `/`, `/posts`, two post slugs, `/apps`, `/apps/vicechips`, `/contexts`, `/contexts/ios-development-best-practices`, and `/search?q=Claude`; see `docs/verifications/phase1-pages.md`. | ✅ |
| Styling + layout | Tailwind tokens and utilities (`tailwind.config.js`, `tailwind.input.css`, `globals.css`) now replicate the legacy fonts/colors/tag pills/skeleton/highlight styles; verification recorded in `docs/verifications/phase1-styling.md`. | ✅ |
| Testing | Vitest and Playwright suites now run together (`pnpm vitest run` + `pnpm --filter app exec playwright test ...`); verification recorded in `docs/verifications/phase1-testing.md`. | ✅ |

## Phase 2 – Admin & Auth parity
| Task | Notes | Status |
| --- | --- | --- |
| NextAuth credentials + sessions | Credentials/Prisma/RateLimiter flow verified via Playwright admin suites (`tests/e2e/admin-content.e2e.ts`, `admin-apps.e2e.ts`, `admin-contexts.e2e.ts`); see `docs/verifications/phase2-auth.md`. | ✅ |
| Admin CRUD | `tests/e2e/admin-content.e2e.ts`, `admin-apps.e2e.ts`, and `admin-contexts.e2e.ts` cover create/edit/delete for posts, apps, and contexts; see `docs/verifications/phase2-admin-crud.md`. | ✅ |
| Uploads | `/admin/upload-image` is exercised by `tests/e2e/admin-upload.e2e.ts`, confirming the upload helper works locally (and via blobs in prod); see `docs/verifications/phase2-uploads.md`. | ✅ |
| Admin UI parity | The `(admin)` layout/components and server actions mirror the legacy Leaf admin templates; summarized in `docs/verifications/phase2-ui.md`. | ✅ |
| Integration tests | The combined Playwright suite now runs public + admin flows (`pages-parity.e2e.ts`, admin specs, dashboards) as described in `docs/verifications/phase2-integration.md`. | ✅ |

## Phase 3 – API & Auxiliary Features
| Task | Notes | Status |
| --- | --- | --- |
| Public APIs | `/api/contexts`, `/api/gists`, `/api/health`, `/api/tags`, and `/api/search` all return the expected data (see `docs/verifications/phase3-apis.md`). | ✅ |
| Search service | `searchContent` returns ≤10 results sorted by title/summary/tag relevance; verified via the API parity suite (`docs/verifications/phase3-apis.md`). | ✅ |
| Tag cloud & caches | `getPostTagCloud`, `getContextTagCloud`, and `getCombinedTagCloud` aggregate tags for `/api/tags`; verified when `docs/verifications/phase3-apis.md` inspects the payload. | ✅ |
| RSS/Feeds | `/rss.xml` and `/feed.json` already provide the 20 latest posts (cache + absolute URLs) and are documented via `docs/verifications/phase3-contexts-api.md`; no outstanding work remains. | ✅ |

## Phase 4 – Observability, Ops, & Parity Polish
| Task | Notes | Status |
| --- | --- | --- |
| Application Insights / OTel | Implemented (`app/instrumentation.ts`). | ✅ |
| Secrets & env management | Runbooks updated (`docs/runbooks/secrets.md`). | ✅ |
| CI/CD enhancements | `ci.yml` and deploy smoke scripts exist. | ✅ |
| Documentation | README/AGENTS/runbooks kept current. | ✅ |

## Phase 5 – Cutover & QA
| Task | Notes | Status |
| --- | --- | --- |
| Data validation | Documented docs under `docs/verifications/phase5-*`. | ✅ |
| Performance & load | k6 load verified (`docs/verifications/phase5-load-test.md`). | ✅ |
| Stakeholder sign-off | Approved and documented (`docs/verifications/phase5-stakeholder-approval.md`). | ✅ |
