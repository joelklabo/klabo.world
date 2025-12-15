#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${SMOKE_BASE_URL:-"https://klabo-world-app.azurewebsites.net"}
ENDPOINTS=("/" "/posts" "/apps" "/search?q=bitcoin" "/api/health")
MAX_ATTEMPTS=${SMOKE_MAX_ATTEMPTS:-6}
RETRY_DELAY_SECONDS=${SMOKE_RETRY_DELAY_SECONDS:-2}
CONNECT_TIMEOUT_SECONDS=${SMOKE_CONNECT_TIMEOUT_SECONDS:-10}
MAX_TIME_SECONDS=${SMOKE_MAX_TIME_SECONDS:-30}

log() { printf '%s\n' "$*" >&2; }

log "🔍 Running deployment smoke checks against ${BASE_URL}"

tmp_resp=$(mktemp)
trap 'rm -f "$tmp_resp"' EXIT

fetch_http_200() {
  local url=$1
  local attempt=1
  local status=""
  local rc=0

  while (( attempt <= MAX_ATTEMPTS )); do
    set +e
    status=$(
      curl -sS \
        --connect-timeout "$CONNECT_TIMEOUT_SECONDS" \
        --max-time "$MAX_TIME_SECONDS" \
        -o "$tmp_resp" \
        -w "%{http_code}" \
        "$url"
    )
    rc=$?
    set -e

    if [[ "$rc" -eq 0 && "$status" == "200" ]]; then
      return 0
    fi

    if [[ "$rc" -ne 0 || "$status" == "000" || "$status" == "502" || "$status" == "503" || "$status" == "504" ]]; then
      log "WARN: Attempt ${attempt}/${MAX_ATTEMPTS} failed for ${url} (curl=${rc}, status=${status}). Retrying..."
      attempt=$((attempt + 1))
      sleep "$RETRY_DELAY_SECONDS"
      continue
    fi

    log "❌ ${url} responded with ${status}"
    cat "$tmp_resp" >&2 || true
    return 1
  done

  log "❌ ${url} did not stabilize after ${MAX_ATTEMPTS} attempts"
  if [[ "$rc" -ne 0 ]]; then
    return "$rc"
  fi
  cat "$tmp_resp" >&2 || true
  return 1
}

for path in "${ENDPOINTS[@]}"; do
  url="${BASE_URL%/}${path}"
  log "→ GET ${url}"
  fetch_http_200 "$url"
  sleep 1
  printf '\n' >&2
  log "✅ ${url}"
  log "Headers:"
  curl -sS -I "$url"
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
