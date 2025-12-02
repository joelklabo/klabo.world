# Turbo Cache Guidance

## When to enable remote cache
- Set `TURBO_TEAM` and `TURBO_TOKEN` in CI and contributor shells when multiple devs share the cache.
- For solo/local work, leave unset to avoid cache churn.

## What we cache
- CI uses `actions/cache` for `.turbo` plus buildx cache for Docker builds.
- Deploy workflow pushes/pulls build cache scopes `deploy`.

## Usage
- Export before running `pnpm turbo ...`:

```bash
export TURBO_TEAM=<org>
export TURBO_TOKEN=<token>
```

## Metrics
- Turbo CLI prints cache hits/misses; in CI inspect the `Turbo cache mode` step and job timing.
- Aim for >70% cache hits on lint/test/build for PRs; if lower, check for changed cache keys (`pnpm-lock.yaml`, `turbo.json`).

## Hygiene
- Keep `turbo.json` tasks stable; avoid adding dynamic env to `dependsOn` unless necessary.
- Bump cache scope names when build graph changes significantly.
- Documented scopes: `deploy` (Docker build), default for repo tasks.

## Troubleshooting
- Cache misses after lockfile change are expected.
- If cache download/upload fails, CI still runs but slower; no need to retry unless repeated.
