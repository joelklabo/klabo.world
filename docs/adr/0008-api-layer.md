# ADR 0008: Forward-Looking API Layer

## Status
Proposed — tracks beads issue `klabw-gfu.1`.

## Context
- Public read APIs are REST today; admin flows and server actions are ad hoc.
- We need end-to-end typing, consistent auth/headers, a shared error taxonomy, and solid observability.
- Internal/admin work should move quickly without overfetch/underfetch overhead.

## Decision
- Adopt **tRPC** for internal/admin/server-side endpoints.
- Keep **REST** for public/unauthenticated surfaces (SEO, caching, third‑party clients).
- Defer **GraphQL** until a multi‑client/third‑party schema is required.

## Conventions
- **Auth**: session injected into tRPC context; public routers explicitly marked and reject session state.
+- **Validation/typing**: zod for inputs/outputs; shared DTOs live in `packages/types` (or a collocated module if needed).
- **Errors**: typed classes → HTTP status when bridged: `BadRequest`, `Unauthorized`, `Forbidden`, `NotFound`, `Conflict`, `RateLimited`, `Internal`.
- **Pagination**: cursor-based (`limit`, `cursor`, optional `totalCount`), with sensible defaults per router.
- **Observability**: span per procedure; record latency, input size, success/error counts; log structured errors with trace IDs.
- **Serialization**: `superjson` for dates/records.
- **Client**: typed fetch client factory for Next server actions; optional `@trpc/react-query` only when client components truly need it.
- **Caching**: cache headers on public REST; keep tRPC internal/uncached by default; allow per-procedure cache hints.

## Migration Plan
1) **Pilot**: add a tRPC router for contexts/search reads; ship a typed client wrapper; keep REST endpoints intact.
2) **Phase 2**: move admin mutations (contexts/apps/posts CRUD) to tRPC; apply the error taxonomy.
3) **Phase 3**: centralize DTOs; enforce zod schemas on all routes (REST + tRPC).
4) **Phase 4**: decide whether to retire duplicated REST endpoints or keep both with versioning.

## Tooling
- `@trpc/server`, `@trpc/client` (optional `@trpc/react-query`)
- `superjson`, `zod`
- Next middleware adapter for auth/session injection
- Typed fetch client factory for server actions

## Risks / Mitigations
- **Bundle size**: avoid client-side tRPC where not needed; use dynamic imports if required.
- **Edge/runtime constraints**: keep tRPC handlers server-only; avoid Node-only libs in shared client code.
- **Caching parity**: preserve strong caching on REST; don’t regress CDN behaviour.
- **Dual surfaces**: clearly document which surface is canonical per use-case.

## Acceptance (for `klabw-gfu.1`)
- ADR merged with decision and rationale.
- Migration plan includes phases and named owners.
- Pilot target (contexts/search) identified and scheduled.
- Beads comment added to `klabw-gfu.1` with links to ADR and pilot issue once created.

### Beads comment text (paste into `klabw-gfu.1`)
Linked ADR: `docs/adr/0008-api-layer.md` (tRPC for internal/admin, keep REST for public). Pilot target: contexts/search reads via tRPC with typed client wrapper. Once ADR is merged and pilot issue is opened, this satisfies acceptance for `klabw-gfu.1`; link the pilot issue here.
