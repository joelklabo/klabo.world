#!/usr/bin/env bash
set -euo pipefail

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
