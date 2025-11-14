#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_HASH=$(echo -n "$REPO_ROOT" | shasum | awk '{print $1}' | cut -c1-8)
DEFAULT_PATH="${TMPDIR:-/tmp}/$(basename "$REPO_ROOT")-${ROOT_HASH}-swift-build"
SCRATCH_PATH="${SWIFT_SCRATCH_PATH:-$DEFAULT_PATH}"
mkdir -p "$SCRATCH_PATH"
echo "$SCRATCH_PATH"
