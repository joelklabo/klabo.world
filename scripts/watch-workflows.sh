#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/watch-workflows.sh "ci,Build, Test, and Deploy to Azure"
# Waits for GitHub Actions workflows matching the names (comma-separated) to start for the current HEAD commit,
# then tails them with `gh run watch --exit-status`.

WORKFLOWS_RAW=${1:-"ci"}
BRANCH=${2:-"main"}
SHA=$(git rev-parse HEAD)

IFS='|' read -ra WORKFLOWS <<<"$WORKFLOWS_RAW"

for WF in "${WORKFLOWS[@]}"; do
  WF_TRIMMED=$(echo "$WF" | xargs)
  echo "🔎 Waiting for workflow '$WF_TRIMMED' on $BRANCH @ $SHA..."
  RUN_ID=""
  until [[ -n "$RUN_ID" ]]; do
    RUN_ID=$(gh run list \
      --workflow "$WF_TRIMMED" \
      --branch "$BRANCH" \
      --limit 20 \
      --json databaseId,headSha \
      --jq ".[] | select(.headSha == \"$SHA\") | .databaseId" | head -n1)
    if [[ -z "$RUN_ID" ]]; then
      sleep 5
    fi
  done
  echo "▶️  Watching $WF_TRIMMED (run id $RUN_ID)..."
  gh run watch "$RUN_ID" --exit-status
done
