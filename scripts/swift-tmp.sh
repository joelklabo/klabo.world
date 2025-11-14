#!/bin/bash
set -euo pipefail

if [ $# -eq 0 ]; then
    exec swift
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRATCH_PATH="$($SCRIPT_DIR/swift-scratch-path.sh)"
SUBCOMMAND="$1"
shift

case "$SUBCOMMAND" in
    build|run|test|package)
        exec swift "$SUBCOMMAND" --scratch-path "$SCRATCH_PATH" "$@"
        ;;
    *)
        exec swift "$SUBCOMMAND" "$@"
        ;;
esac
