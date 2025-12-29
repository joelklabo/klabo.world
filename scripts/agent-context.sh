#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
NODE_VERSION="$(node -v 2>/dev/null || echo missing)"
PNPM_VERSION="$(pnpm -v 2>/dev/null || echo missing)"
REQUIRED_NODE="$(awk '/^nodejs /{print $2}' "$REPO_ROOT/.tool-versions" 2>/dev/null || true)"

cat <<INFO
KLABO.WORLD – AGENT CONTEXT
===========================
Root: $REPO_ROOT
Node: $NODE_VERSION
PNPM: $PNPM_VERSION
INFO

if [[ -n "$REQUIRED_NODE" && "$NODE_VERSION" != "missing" ]]; then
  CURRENT_NODE="${NODE_VERSION#v}"
  if [[ "$(printf '%s\n' "$CURRENT_NODE" "$REQUIRED_NODE" | sort -V | head -n1)" != "$REQUIRED_NODE" ]]; then
    echo "Node version warning: expected >= $REQUIRED_NODE (tool-versions), found $CURRENT_NODE"
    echo "Run: just bootstrap (or: mise install && mise use)"
  fi
fi

cat <<INFO

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
