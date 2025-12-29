#!/usr/bin/env bash
set -euo pipefail

TIMEOUT_MS="${MCP_PROTOCOL_TIMEOUT:-60000}"
TARGET_URL="${MCP_TARGET_URL:-http://127.0.0.1:3100}"

cat <<EOF
DevTools MCP check helper
=========================
Target URL: ${TARGET_URL}
Protocol timeout: ${TIMEOUT_MS}ms

Run MCP checks from Codex with:
  MCP_PROTOCOL_TIMEOUT=${TIMEOUT_MS} MCP_TARGET_URL=${TARGET_URL}

Then open a DevTools MCP session and verify console/network are clean.
EOF
