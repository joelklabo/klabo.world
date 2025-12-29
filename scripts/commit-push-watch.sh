#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

usage() {
  echo "Usage: $(basename "$0") [-m \"commit message\"] [-w \"workflow|pattern\"]" >&2
  echo "Examples:" >&2
  echo "  $(basename "$0") -m \"feat: add search polish\" -w \"ci|Build, Test, and Deploy to Azure\"" >&2
  echo "  $(basename "$0") \"feat: add search polish\"" >&2
  exit 1
}

COMMIT_MESSAGE=""
WORKFLOWS="ci|Build, Test, and Deploy to Azure"

while getopts ":m:w:h" opt; do
  case "$opt" in
    m) COMMIT_MESSAGE="$OPTARG" ;;
    w) WORKFLOWS="$OPTARG" ;;
    h) usage ;;
    \?) echo "Invalid option: -$OPTARG" >&2; usage ;;
    :) echo "Option -$OPTARG requires an argument." >&2; usage ;;
  esac
done

shift $((OPTIND - 1))

if [[ -z "$COMMIT_MESSAGE" && $# -gt 0 ]]; then
  COMMIT_MESSAGE=$1
  shift
fi

if [[ -z "$COMMIT_MESSAGE" || $# -gt 0 ]]; then
  usage
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [[ "${SKIP_NODE_PREFLIGHT:-0}" != "1" ]]; then
  REQUIRED_NODE="$(awk '/^nodejs /{print $2}' "$REPO_ROOT/.tool-versions" 2>/dev/null || true)"
  CURRENT_NODE="$(node -v 2>/dev/null || echo missing)"
  if [[ -n "$REQUIRED_NODE" && "$CURRENT_NODE" != "missing" ]]; then
    CURRENT_NODE="${CURRENT_NODE#v}"
    if [[ "$(printf '%s\n' "$CURRENT_NODE" "$REQUIRED_NODE" | sort -V | head -n1)" != "$REQUIRED_NODE" ]]; then
      echo "⚠️  Node version mismatch: expected >= $REQUIRED_NODE, found $CURRENT_NODE" >&2
      echo "    Run: mise install && mise use (or set SKIP_NODE_PREFLIGHT=1 to skip)" >&2
    fi
  fi
fi

git add -A

if git diff --cached --quiet; then
  echo "Nothing to commit. Stage changes before running this script." >&2
  exit 1
fi

git commit -m "$COMMIT_MESSAGE"
git push origin "$BRANCH"

SHA=$(git rev-parse HEAD)
SHORT_SHA=${SHA:0:7}
SESSION_NAME="ci-watch-${SHORT_SHA}"

if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  tmux kill-session -t "$SESSION_NAME"
fi

tmux new-session -d -s "$SESSION_NAME" "bash -lc './scripts/watch-workflows.sh -w \"$WORKFLOWS\" -b \"$BRANCH\" -s \"$SHA\"; printf \"\nCI workflows complete. Press Enter to close...\"; read'"

echo "✅ Committed and pushed $SHORT_SHA."
echo "📡 Watching workflows ($WORKFLOWS) in tmux session '$SESSION_NAME'."
echo "➡️  Attach with: tmux attach -t $SESSION_NAME"
