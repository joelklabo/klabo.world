# Runbook: Feature Flags

## Goal
Provide a lightweight, provider-agnostic flag system that works locally (env/in-memory), scales to Redis when available, and leaves a clean adapter point for a hosted provider (LaunchDarkly/Statsig) without rewriting callers.

## Architecture
- **Flag kernel**: single interface used by server actions, admin flows, and background jobs.
- **Adapters** (in order of preference at runtime):
  1) In-memory defaults from env/JSON (always available; good for local/offline).
  2) Redis adapter if `REDIS_URL` is set (shared state + kill switch).
  3) Provider adapter slot (LaunchDarkly/Statsig) behind the same interface.
- **API surface**:
  - `getFlag(key, ctx): boolean | variant`
  - `getAll(prefix?)`
  - `withFlag(key, fn)` helper for guardrails
  - Flag metadata: `key`, `type`, `default`, `owner`, `expiry`, `kill_severity`, `issue_link`

## Governance
- Every flag must declare: owner, expiry date, default, issue/beads link, and kill-switch severity.
- Add lint/check to fail CI if metadata is missing.
- Nightly/CI script: list expired flags and those without owners; post to logs and Beads (`bd comment`).
- Kill switch path: Redis/global path first, then in-memory fallback.

## Telemetry
- Emit a span/log per evaluation (sampled): key, variant, bucket (anon/user), latency, cache hit/miss.
- Add a “flag heartbeat” endpoint or log line on boot to confirm adapter and counts.

## First flag (acceptance for klabw-gfu.2)
- Guard the API-layer pilot rollout (or a small UI feature).
- Tests: default path (no Redis), Redis path, missing flag → default, and kill-switch behavior.

## Provider quick compare
- **LaunchDarkly**: best governance/audit; higher cost; solid JS SDK; edge support limited.
- **Statsig**: strong experiments + flags, good JS/edge story, lower cost.
- **In-house (Redis)**: $0 and private; no UI/audit; good enough for current needs and swappable later.

## Implementation steps
1) Create flag metadata registry (TS) and kernel interface in `app/src/lib/flags` (or shared package).
2) Implement in-memory + Redis adapters; add provider adapter stub.
3) Wire `getFlag` into the first guarded feature and add Vitest coverage for the cases above.
4) Add lint/check + nightly script to surface missing/expired flags.

## Checklist (for `klabw-gfu.2`)
- [ ] Create `app/src/lib/flags` with kernel interface + metadata registry.
- [ ] Implement in-memory adapter (env/JSON defaults).
- [ ] Implement Redis adapter (guarded by `REDIS_URL`) incl. kill-switch path.
- [ ] Add provider adapter stub for LaunchDarkly/Statsig behind the same interface.
- [ ] Provide helpers: `getFlag`, `getAll`, `withFlag`; metadata fields (owner, expiry, default, kill_severity, issue_link).
- [ ] Guard the first feature (API-layer pilot) and add Vitest for default, Redis, missing-flag fallback, kill-switch.
- [ ] Add lint/check to fail CI on missing owner/expiry/default; script to list expired flags.
- [ ] Emit sampled telemetry on evaluations and a startup heartbeat reporting adapter + counts.

## Runtime helpers
- Env override for local/offline toggles: `FEATURE_FLAGS_JSON='{"api-layer-pilot":true}'`.
- Expiry checker: `pnpm flags:check` (runs `scripts/list-expired-flags.js`, exits non-zero if any flag is past `expiry`).

## Beads comment template for `klabw-gfu.2`
Linked runbook: `docs/runbooks/feature-flags.md`. Kernel: env/in-memory → Redis → provider adapter. First flag guards API-layer pilot; includes tests (default, Redis, missing, kill-switch). Governance: owner+expiry required, lint + nightly expired-flag check. Telemetry: sampled eval logs + startup heartbeat. Paste this after creating the first flag PR/issue.
