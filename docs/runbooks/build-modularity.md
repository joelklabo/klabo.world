---
title: Monorepo Build Modularity & Performance Plan
status: draft
owner: platform
created: 2025-11-29
---

## Current Baseline
- Turbo cold (app: lint+test+build) on local: **60.99s** (no cache).
- Turbo warm (app) after cache: **6.36s**.
- CI Build, Test, and Deploy to Azure: **~4m44s** cold, **~4m27s** cached (runs 19786305710, 19786385225).
- Caches today:
  - Workspace `.turbo` cached per runner via `actions/cache`.
  - No remote Turbo cache; no Docker layer cache in deploy workflow.
  - Next build already uses Turbopack; Contentlayer + Prisma run once per pipeline.

## Goals
- Cut cold app pipeline (lint+test+build) to <40s locally and <3m30s in CI.
- Achieve stable cache hits across CI runs (remote cache) and across PRs.
- Reduce deploy workflow image build time via Docker layer caching.

## Plan
1) **Remote Turbo cache**
   - Add `TURBO_TEAM` + `TURBO_TOKEN` GitHub Actions secrets.
   - Export them in both workflows so Turbo uploads/downloads; verify cache hits on consecutive CI runs.
   - Track hit rate via Turbo logs; target >70% cache hit for lint/test/build on PRs.
2) **Split generation tasks**
   - Define Turbo tasks for `contentlayer` and `prisma:generate`; depend on them in `build`.
   - Mark their outputs for caching to avoid reruns when sources unchanged.
   - Measure before/after on cold/warm runs.
3) **Package scoping**
   - Ensure lint/test/build run only for affected packages; keep `--filter=app` in workflows but enable `--affected` in PR CI once Turbo remote cache is live.
4) **Docker layer cache for deploy**
   - Use `docker/build-push-action` cache-from/cache-to with GHCR `buildx` cache manifest.
   - Expect faster image builds on main deploys.
5) **Artifact pruning**
   - Exclude `.next/cache/**` from cache upload to shrink `.turbo` size; keep build outputs.
   - Monitor cache size to stay under GitHub cache limits.
6) **Follow-up metrics**
   - Re-measure cold/warm Turbo runs and CI runtimes after remote cache + task split.
   - Close klabw-gfu.3.1 after remote cache is proven; then close klabw-4ki with updated metrics.

## Open Questions / Blockers
- Need `TURBO_TEAM` slug and `TURBO_TOKEN` with write scope for repo/CI.
- For Docker cache, need to decide retention policy and registry namespace (recommend `ghcr.io/<owner>/klaboworld-buildcache`).
