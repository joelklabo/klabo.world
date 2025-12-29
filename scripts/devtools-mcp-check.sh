#!/usr/bin/env bash
set -euo pipefail

DEFAULT_TIMEOUT_MS="${MCP_PROTOCOL_TIMEOUT:-60000}"
DEFAULT_TARGET_URL="${MCP_TARGET_URL:-http://127.0.0.1:3100}"
TIMEOUT_MS="$DEFAULT_TIMEOUT_MS"
TARGET_URL="$DEFAULT_TARGET_URL"

usage() {
  cat <<EOF
Usage: $(basename "$0") [--timeout <ms>] [--url <url>]

Examples:
  $(basename "$0") --timeout 120000 --url http://127.0.0.1:3100
  MCP_PROTOCOL_TIMEOUT=120000 $(basename "$0")
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --timeout)
      TIMEOUT_MS="${2:-$DEFAULT_TIMEOUT_MS}"
      shift 2
      ;;
    --url)
      TARGET_URL="${2:-$DEFAULT_TARGET_URL}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if ! [[ "$TIMEOUT_MS" =~ ^[0-9]+$ ]]; then
  TIMEOUT_MS="$DEFAULT_TIMEOUT_MS"
fi

cat <<EOF
DevTools MCP check helper
=========================
Target URL: ${TARGET_URL}
Protocol timeout: ${TIMEOUT_MS}ms

Run MCP checks from Codex with:
  MCP_PROTOCOL_TIMEOUT=${TIMEOUT_MS} MCP_TARGET_URL=${TARGET_URL}

Then open a DevTools MCP session and verify console/network are clean.
EOF
