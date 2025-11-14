#!/usr/bin/env bash
set -euo pipefail

cat <<'INFO'
KLABO.WORLD – AGENT CONTEXT
===========================
Root: $(pwd)
Node: $(node -v 2>/dev/null || echo missing)
PNPM: $(pnpm -v 2>/dev/null || echo missing)

Primary commands:
  just bootstrap   # pins pnpm + installs deps
  just dev        # runs docker-compose services + next dev server
  just lint/test  # wrappers around turbo
  just doctor     # envinfo + docker status
  just agent-shell# tmux layout for AI/humans

Services:
  Postgres 17.6  localhost:5432  klaboworld/klaboworld
  Redis    7.4   localhost:6379
  Azurite        localhost:10000

Docs:
  AGENTS.md – workflows
  docs/modernization-plan.md – architecture
  docs/verifications/ – evidence snapshots
INFO
