#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: commit-push-watch.sh \"commit message\" [workflow-list]" >&2
  exit 1
fi

COMMIT_MESSAGE=$1
WORKFLOWS=${2:-"ci|Build, Test, and Deploy to Azure"}
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
