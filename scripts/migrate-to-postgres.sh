#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/migrate-to-postgres.sh [--dry-run] [--schema <path>]

Runs Prisma generate + migrate deploy using the Postgres schema.

Options:
  --dry-run         Print commands without executing them
  --schema <path>   Override schema path (default: app/prisma/schema.postgres.prisma)
  -h, --help        Show this help
USAGE
}

SCHEMA_PATH="app/prisma/schema.postgres.prisma"
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --schema)
      SCHEMA_PATH="$2"
      shift 2
      ;;
    --schema=*)
      SCHEMA_PATH="${1#*=}"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required (set to a Postgres connection string)." >&2
  exit 1
fi

if [[ "${DATABASE_URL}" == file:* ]]; then
  echo "DATABASE_URL points to SQLite; provide a Postgres URL." >&2
  exit 1
fi

if [[ ! -f "$SCHEMA_PATH" ]]; then
  echo "Schema not found at $SCHEMA_PATH" >&2
  exit 1
fi

log() { printf '%s\n' "$*" >&2; }

run() {
  if [[ "$DRY_RUN" == "true" ]]; then
    log "+ $*"
    return 0
  fi
  "$@"
}

log "Using schema: $SCHEMA_PATH"
log "DATABASE_URL is set (value redacted)."

run pnpm --filter app exec prisma generate --schema "$SCHEMA_PATH"
run pnpm --filter app exec prisma migrate deploy --schema "$SCHEMA_PATH"

log "Postgres migration helper finished."
