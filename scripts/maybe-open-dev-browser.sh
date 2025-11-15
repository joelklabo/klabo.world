#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -z "${AUTO_OPEN_BROWSER:-}" && -f "${ROOT_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.env"
  set +a
fi

if [[ "${AUTO_OPEN_BROWSER:-false}" != "true" ]]; then
  exit 0
fi

DEV_URL="${DEV_SERVER_URL:-http://localhost:3000}"
ADMIN_URL="${ADMIN_SERVER_URL:-http://localhost:3000/admin}"

if command -v open >/dev/null 2>&1; then
  OPEN_CMD="open"
elif command -v xdg-open >/dev/null 2>&1; then
  OPEN_CMD="xdg-open"
else
  echo "⚠️  Unable to locate 'open' or 'xdg-open'; skipping browser launch." >&2
  exit 0
fi

"${OPEN_CMD}" "${DEV_URL}" >/dev/null 2>&1 &
"${OPEN_CMD}" "${ADMIN_URL}" >/dev/null 2>&1 &
