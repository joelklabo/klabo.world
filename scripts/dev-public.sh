#!/bin/bash
set -euo pipefail

PORT="${PORT:-3000}"
HOST="${HOST:-0.0.0.0}"

# Start local services if docker is available (best effort).
if command -v docker >/dev/null 2>&1; then
  docker compose -f docker-compose.dev.yml up -d db redis azurite >/dev/null 2>&1 || true
fi

echo "Starting dev server (host=${HOST} port=${PORT})..."

# Ensure Contentlayer artifacts exist before Next boots.
# The Next plugin typically handles this, but in practice it can race on a fresh clone.
PNPM_HOME=${PNPM_HOME:-$HOME/.local/share/pnpm} mise exec -- bash -lc "cd app && pnpm exec contentlayer build"

# Run Next dev in foreground.
# Use `pnpm exec next dev` to avoid argument parsing quirks through nested pnpm scripts.
PNPM_HOME=${PNPM_HOME:-$HOME/.local/share/pnpm} mise exec -- bash -lc "cd app && pnpm exec next dev -p \"${PORT}\" -H \"${HOST}\""
