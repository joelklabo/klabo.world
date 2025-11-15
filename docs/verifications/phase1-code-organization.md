# Phase 1 – Code Organization Verification (2025-11-15)
Todo: confirm repo layout matches modernization plan.

## Commands & Outputs
```
ls content
apps
contexts
dashboards
posts
```
```
ls packages
config
scripts
ui
```
```
ls docs
azure
deployment
experimental
guides
infra
integration
plans
runbooks
security
testing
vapor
verifications
```

## Observations
- `content/{posts,apps,contexts,dashboards}` keeps Markdown/JSON as the source of truth for all published material; `contentlayer.config.ts` builds typed objects for the Next app.
- The Next.js app lives in `app/` with its own `src/app`, `prisma`, `contentlayer.config.ts`, and supporting scripts, matching the plan’s separation between UI and tooling.
- Shared tooling sits under `packages/{config,scripts,ui}` so workspace-aware lint/test/build logic can be reused.
- Documentation has been consolidated entirely under `docs/` following the new inventory schema, fulfilling the plan’s requirement to centralize runbooks and guides.

## Result
Structure aligns with the modernization plan; no additional relocation or new directories are needed at this time. Update this verification note if the layout changes or additional directories get introduced.
