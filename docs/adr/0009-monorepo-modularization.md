# ADR 0009: Modularize the Monorepo for Faster Builds

## Status
Proposed — targets beads issue `klabw-4ki`.

## Context
- Current workspace: `app` (Next.js), `packages/config`, `packages/scripts`, `packages/ui` (placeholder).
- Turbo config is minimal (single pipeline, no package‑specific outputs/depends). Remote caching not configured.
- Baseline build timing could not be captured because `pnpm --filter app build` fails on an existing TypeScript error (`TextArea` vs `Textarea` in `app/src/app/(admin)/components/dashboard-form.tsx`). This must be fixed before measuring.

## Goals (measurable)
- Cold build (`pnpm turbo build`) < 60s on M1/16GB with clean cache.
- Incremental Next rebuild after a single page/lib change < 5s.
- Lint + unit tests < 20s when cache is warm; < 60s cold.
- CI parity with local timings using Turbo remote cache (TURBO_TEAM + TURBO_TOKEN).

## Proposed package boundaries
- `app/` – stays the Next.js surface; contains pages/routes and minimal glue code.
- `packages/config` – shared eslint/tsconfig (unchanged).
- `packages/scripts` – CLIs and deployment helpers (unchanged; ensure isolated build).
- `packages/ui` – promote to real component library (shadcn primitives + shared form controls, charts stubs).
- `packages/types` (new) – shared DTOs/flag metadata/tRPC types.
- `packages/core` (new) – shared server utilities (logger, feature flags, markdown preview, blob storage helpers) to shrink `app/src/lib`.

## Turbo pipeline shaping
- Convert `turbo.json` to per-task pipeline with package-aware outputs:
  - `lint`: `dependsOn: ["^lint"]`, `outputs: []`.
  - `test`: `dependsOn: ["lint"]`, `outputs: []`.
  - `build` (Next app): `dependsOn: ["^build"]`, `outputs: [".next/**", "app/.contentlayer/generated/**"]`.
  - `build` (packages): `outputs: ["dist/**", "build/**"]`.
- Enable remote caching via env (`TURBO_TEAM`, `TURBO_TOKEN`) in CI; keep local caching on by default.
- Add `pipeline.{lint,test}.cache: true` and `persistent=true` for watch tasks as needed.

## Sequencing
1. **Unblock baseline**: fix the existing `Textarea` typo so `pnpm --filter app build` passes; record cold build time.  
2. **Turbo rewrite**: move to package-aware pipeline with explicit outputs/depends; add `--filter ...` examples to AGENTS if needed.  
3. **Create `packages/types` + `packages/core`**: move flag types/registry, logger, markdown preview, and shared DTOs out of `app/src/lib`.  
4. **Promote `packages/ui`**: move shared form controls and dashboard widgets; export only typed, tree-shakeable components.  
5. **Remote cache rollout**: configure Turbo cloud or self-hosted, document env vars, and enable in CI.  
6. **Re-measure**: capture cold/warm timings for build, lint, test; adjust chunking (e.g., split app build into `app#build:server` / `app#build:client` if needed).  
7. **Guardrails**: add lint to prevent cross-package deep imports and enforce public API surfaces.

## Risks / mitigations
- **Refactor churn**: move code in small, well-tested slices (flags → core; DTOs → types; UI → ui) with Vitest/Playwright coverage.
- **Cache misses**: ensure outputs are declared; avoid `dependsOn` cycles; pin Node/pnpm (already in `.tool-versions`).
- **Remote cache secrets**: store tokens in CI secrets; avoid local `.env` leakage.

## Acceptance criteria (for `klabw-4ki`)
- Documented pipeline + package boundary plan (this ADR) and updated `docs/document-inventory.md`.
- Baseline build timing recorded after fixing current build error.
- Turbo config updated with package-aware outputs/depends and remote cache toggle.
- New packages (`types`, `core`) scaffolded and first shared module migrated.
