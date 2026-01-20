#!/bin/bash
set -euo pipefail

PORT="${1:-3000}"

# Prefer LAN-ish IPs.
if command -v ipconfig >/dev/null 2>&1; then
  IP=$(ipconfig getifaddr en0 2>/dev/null || true)
  if [ -z "${IP}" ]; then
    IP=$(ipconfig getifaddr en1 2>/dev/null || true)
  fi
else
  IP=$(hostname -I 2>/dev/null | awk '{print $1}' || true)
fi

if [ -z "${IP}" ]; then
  IP="localhost"
fi

echo "http://${IP}:${PORT}"
