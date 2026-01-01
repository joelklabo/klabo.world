# ADR 0011: Contentlayer Remediation Decision

## Status
Accepted — targets beads issue `klabw-9dk.11`.

## Context
- ADR 0004 established Contentlayer as the file-first content pipeline.
- Contentlayer CLI errors under Node 24 are recorded in `docs/verifications/contentlayer-build.md`.
- The repo standardizes on Node 24.11.1 via `.tool-versions` and `.nvmrc`.
- We need stable CI builds while preserving MDX feature parity and typed schemas.

## Options considered
1. **Pin/patch Contentlayer** (stay file-first).
   - Pros: minimal refactor; preserves generated types and existing imports.
   - Cons: relies on an unmaintained dependency; risk of future breakage.
2. **Migrate to a maintained pipeline** (MDX bundler or similar).
   - Pros: long-term support on Node 24; fewer brittle patches.
   - Cons: larger refactor; parity risk for shortcodes/frontmatter.

## Decision
Choose Option 1 as a timeboxed remediation: keep Contentlayer and apply a patch/pin strategy to restore Node 24 compatibility. If this cannot be stabilized within the timebox, we will execute Option 2 and migrate to a maintained pipeline.

## Rationale
- Minimizes near-term disruption while hardening other critical paths.
- Keeps file-first content, schemas, and generated types intact.
- Preserves the ability to ship while evaluating replacement tooling.

## Timeline
- **By 2026-01-08**: implement patch/pin changes and verify `pnpm check:all` + `pnpm turbo build --filter=app`.
- **By 2026-01-15**: validate MDX parity (posts/apps/dashboards) and update verification docs.
- **By 2026-02-28**: if Contentlayer remains unstable, start migration execution.

## Follow-ups / Required changes
- Update Contentlayer configs (`app/contentlayer.config.ts`, `contentlayer.config.ts`) to align with the patch strategy.
- Update Next build config (`app/next.config.ts`) as needed for stable builds.
- Add CI constraints/guards for Node 24 and Contentlayer build steps.
- Document pinned dependencies or patches in `patches/` and `package.json`.
- If migration is triggered, create a new ADR and tasks for the replacement pipeline.

## Risks / Mitigations
- **Patch does not resolve Node 24 errors**: timebox and trigger migration.
- **Unmaintained dependency**: keep migration plan ready.
- **MDX parity regressions**: run parity checks and document results in `docs/verifications/`.
