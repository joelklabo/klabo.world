# Modernization Roadmap

This parent plan collects all of the active modernization efforts and maps them into phases so we can track progress in one place.

## Phases
1. **Modernization Foundation**
   - Aligns with `docs/plans/modernization.md`.
   - Goals: stabilize the Next.js/Contentlayer/Prisma stack, document the new workflows, and confirm CI/CD runs against Azure. 
   - Deliverables: final `AGENTS.md`, README updates, and scoped cutover/runbook work.
2. **Dashboard Observability**
   - Refer to `docs/plans/dashboard.md` for the detailed plan of building admin dashboards, log integrations, and analytics panels.
   - Includes persisting dashboards via Contentlayer, admin UI, and telemetry instrumentation.
3. **Feature Parity**
   - Mirrors `docs/plans/feature-parity.md` (legacy posts/apps/contexts/cms functionality plus GitHub-backed persistence).
   - Complete CRUD for posts/apps/contexts, GitHub sync, uploads, search parity, and admin tooling.
4. **Continuing Overview & Stability**
   - Refers to `docs/plans/overview.md` for the high-level iteration plan covering monitoring, CI hygiene, documentation, and expandability for future phases.

## Execution Notes
- Each phase should be tracked via conventional commits (e.g., `feat: ...`, `docs: ...`).
- Once a phase is complete, capture verification artifacts under `docs/verifications/phaseX-*.md` and update this roadmap.
- New sub-plans (for dashboards, feature parity, etc.) should be linked from the respective phase section above.
