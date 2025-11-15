#!/usr/bin/env bash
set -euo pipefail

# Legacy entrypoint that now defers to gh-commit-watch.
# Keeping this file ensures existing scripts invoking watch-workflows keep working.

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
exec "$SCRIPT_DIR/gh-commit-watch" "$@"
