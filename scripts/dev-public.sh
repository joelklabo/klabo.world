#!/bin/bash
set -euo pipefail

PORT="${PORT:-3000}"
HOST="${HOST:-0.0.0.0}"

# Start local services if docker is available (best effort).
if command -v docker >/dev/null 2>&1; then
  docker compose -f docker-compose.dev.yml up -d db redis azurite >/dev/null 2>&1 || true
fi

echo "Starting dev server (host=${HOST} port=${PORT})..."

# Run Next dev in foreground.
PNPM_HOME=${PNPM_HOME:-$HOME/.local/share/pnpm} mise exec -- pnpm --filter app run dev -- --hostname "${HOST}" --port "${PORT}"
