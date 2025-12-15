#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $(basename "$0") -w \"workflow|pattern\" -b <branch> -s <sha> [-t <seconds>]" >&2
  echo "Example:" >&2
  echo "  $(basename "$0") -w \"ci|Build, Test, and Deploy to Azure\" -b main -s \$(git rev-parse HEAD)" >&2
  exit 1
}

WORKFLOWS="ci|Build, Test, and Deploy to Azure"
BRANCH=""
SHA=""
TIMEOUT_SECONDS=900

while getopts ":w:b:s:t:h" opt; do
  case "$opt" in
    w) WORKFLOWS="$OPTARG" ;;
    b) BRANCH="$OPTARG" ;;
    s) SHA="$OPTARG" ;;
    t) TIMEOUT_SECONDS="$OPTARG" ;;
    h) usage ;;
    \?) echo "Invalid option: -$OPTARG" >&2; usage ;;
    :) echo "Option -$OPTARG requires an argument." >&2; usage ;;
  esac
done

if [[ -z "$BRANCH" || -z "$SHA" ]]; then
  usage
fi

POLL_SECONDS=3
DEADLINE=$((SECONDS + TIMEOUT_SECONDS))

echo "🔎 Waiting for workflows ($WORKFLOWS) on branch '$BRANCH' for commit ${SHA:0:7}..."

get_matching_run_ids() {
  gh run list --branch "$BRANCH" --limit 50 --json databaseId,headSha,name \
    --jq ".[] | select(.headSha==\"$SHA\") | select(.name | test(\"$WORKFLOWS\")) | .databaseId" \
    2>/dev/null || true
}

RUN_IDS=""
while [[ -z "$RUN_IDS" ]]; do
  if (( SECONDS > DEADLINE )); then
    echo "Timed out waiting for workflow runs for $SHA on $BRANCH" >&2
    exit 1
  fi
  RUN_IDS=$(get_matching_run_ids | sort -u | tr '\n' ' ' | xargs echo 2>/dev/null || true)
  [[ -z "$RUN_IDS" ]] && sleep "$POLL_SECONDS"
done

echo "📡 Watching runs: $RUN_IDS"

status=0
for run_id in $RUN_IDS; do
  echo "➡️  gh run watch $run_id --exit-status"
  gh run watch "$run_id" --exit-status || status=$?
done

exit "$status"

