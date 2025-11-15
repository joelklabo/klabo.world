#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${SMOKE_BASE_URL:-"https://klabo-world-app.azurewebsites.net"}
ENDPOINTS=("/" "/posts" "/apps" "/contexts" "/search?q=bitcoin" "/api/health")

log() { printf '%s\n' "$*" >&2; }

log "🔍 Running deployment smoke checks against ${BASE_URL}"

tmp_resp=$(mktemp)
trap 'rm -f "$tmp_resp"' EXIT

for path in "${ENDPOINTS[@]}"; do
  url="${BASE_URL%/}${path}"
  log "→ GET ${url}"
  status=$(curl -s -o "$tmp_resp" -w "%{http_code}" "$url")
  if [[ "$status" != "200" ]]; then
    log "❌ ${url} responded with ${status}"
    cat "$tmp_resp" >&2 || true
    exit 1
  fi
  sleep 1
  printf '\n' >&2
  log "✅ ${url}"
  log "Headers:"
  curl -s -I "$url"
  log "Body preview:"
  head -n 10 "$tmp_resp" || true
  printf '\n' >&2
  log "curl -s \"${url}\""
  printf '\n' >&2
  log "---"
  printf '\n' >&2
  >"$tmp_resp"
  sleep 1
done

log "✅ Deployment smoke checks passed."
