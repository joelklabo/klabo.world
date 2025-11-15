#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
SCRIPT_PATH="$SCRIPT_DIR/$(basename "${BASH_SOURCE[0]}")"
ORIGINAL_ARGS=("$@")
ACTIVE_STATUS_PID=""

cleanup() {
  if [[ -n "${ACTIVE_STATUS_PID:-}" ]]; then
    kill "${ACTIVE_STATUS_PID}" 2>/dev/null || true
    wait "${ACTIVE_STATUS_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

usage() {
  cat <<'EOF'
Usage: watch-workflows.sh [options] -m "Commit message" [WORKFLOW_LIST]

Stage all changes, create a commit with the provided message, push the current
branch to origin, ensure the script is running inside a tmux session, then wait
for GitHub Actions workflows that match the provided names to start for the new
HEAD. Once a run is found it is tailed with `gh run watch --exit-status`, and a
short status summary is printed every minute until completion.

WORKFLOW_LIST can be a quoted string whose workflow names are separated by
commas or pipes. When omitted, the default list is "ci".

Options:
  -m, --message <text>     Commit message to use (required)
  -w, --workflows <list>   Workflow names (comma- or pipe-separated)
  -b, --branch <name>      Branch to push and filter by (defaults to current)
  -s, --sha <sha>          Override the commit SHA to watch (advanced)
  -r, --repo <path>        Path to the git repository (defaults to cwd)
  -p, --poll-interval <s>  Seconds between checks for workflow runs (default: 5)
      --tmux-session <id>  Name for the tmux session that will be created
  -h, --help               Show this help text

Examples:
  watch-workflows.sh -m "Sync latest tweaks"
  watch-workflows.sh -m "Fix build" -w "ci|deploy" -p 10
  watch-workflows.sh -m "Release 1.2.3" -r ~/code/app --tmux-session release-ci
EOF
}

err() {
  echo "watch-workflows: $*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || err "missing required command '$1'"
}

derive_repo_slug() {
  local url="$1"
  local slug=""

  url=${url%.git}

  if [[ "$url" =~ ^git@[^:]+:(.+)$ ]]; then
    slug="${BASH_REMATCH[1]}"
  elif [[ "$url" =~ ^ssh://[^/]+/(.+)$ ]]; then
    slug="${BASH_REMATCH[1]}"
  elif [[ "$url" =~ ^https?://[^/]+/(.+)$ ]]; then
    slug="${BASH_REMATCH[1]}"
  elif [[ "$url" =~ ^git://[^/]+/(.+)$ ]]; then
    slug="${BASH_REMATCH[1]}"
  else
    slug="$url"
  fi

  slug=${slug%.git}
  echo "$slug"
}

start_status_loop() {
  local run_id="$1"
  (
    while true; do
      local stamp info
      stamp=$(date '+%Y-%m-%d %H:%M:%S')
      if ! info=$(gh run view "$run_id" \
        --repo "$REPO_SLUG" \
        --json workflowName,runNumber,status,conclusion,updatedAt,url \
        --jq '"\(.workflowName) #\(.runNumber) status=\(.status // "unknown") conclusion=\(.conclusion // "pending") updated=\(.updatedAt // "n/a") url=\(.url // "n/a")"' 2>/dev/null); then
        echo "ℹ️ [$stamp] Unable to fetch run status (run may have finished)."
        break
      fi
      echo "ℹ️ [$stamp] $info"
      sleep 60 || break
    done
  ) &
  ACTIVE_STATUS_PID=$!
}

stop_status_loop() {
  if [[ -n "${ACTIVE_STATUS_PID:-}" ]]; then
    kill "${ACTIVE_STATUS_PID}" 2>/dev/null || true
    wait "${ACTIVE_STATUS_PID}" 2>/dev/null || true
    ACTIVE_STATUS_PID=""
  fi
}

ensure_tmux_session() {
  if (( SKIP_TMUX )); then
    return
  fi

  if [[ -n "${TMUX:-}" ]]; then
    return
  fi

  require_cmd tmux

  local session_name="$TMUX_SESSION_NAME"
  if [[ -z "$session_name" ]]; then
    session_name="watch-wf-$(date +%Y%m%d%H%M%S)"
  fi

  if tmux has-session -t "$session_name" 2>/dev/null; then
    session_name="${session_name}-$$"
  fi

  local cmd
  local args=("$SCRIPT_PATH" "--skip-tmux" "${ORIGINAL_ARGS[@]}")
  printf -v cmd '%q ' "${args[@]}"

  echo "🪟 Starting tmux session '$session_name'..."
  tmux new-session -d -s "$session_name" "$cmd"
  tmux attach -t "$session_name"
  exit 0
}

WORKFLOWS_INPUT=""
BRANCH=""
SHA=""
SHA_PROVIDED=0
REPO_DIR=""
POLL_INTERVAL=5
COMMIT_MESSAGE=""
TMUX_SESSION_NAME=""
SKIP_TMUX=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--message)
      [[ $# -lt 2 ]] && err "expected commit message after $1"
      COMMIT_MESSAGE=$2
      shift 2
      ;;
    -w|--workflows)
      [[ $# -lt 2 ]] && err "expected value after $1"
      WORKFLOWS_INPUT=$2
      shift 2
      ;;
    -b|--branch)
      [[ $# -lt 2 ]] && err "expected value after $1"
      BRANCH=$2
      shift 2
      ;;
    -s|--sha|--commit)
      [[ $# -lt 2 ]] && err "expected value after $1"
      SHA=$2
      SHA_PROVIDED=1
      shift 2
      ;;
    -r|--repo|-C)
      [[ $# -lt 2 ]] && err "expected value after $1"
      REPO_DIR=$2
      shift 2
      ;;
    -p|--poll-interval)
      [[ $# -lt 2 ]] && err "expected value after $1"
      POLL_INTERVAL=$2
      shift 2
      ;;
    --tmux-session)
      [[ $# -lt 2 ]] && err "expected value after $1"
      TMUX_SESSION_NAME=$2
      shift 2
      ;;
    --skip-tmux)
      SKIP_TMUX=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      break
      ;;
    -*)
      err "unknown option '$1'"
      ;;
    *)
      break
      ;;
  esac
done

if [[ -z "$WORKFLOWS_INPUT" && $# -gt 0 ]]; then
  WORKFLOWS_INPUT=$1
  shift
fi

[[ $# -gt 0 ]] && err "unexpected argument '$1'"

[[ -n "$COMMIT_MESSAGE" ]] || err "a commit message is required (-m/--message)"

if [[ -z "$WORKFLOWS_INPUT" ]]; then
  WORKFLOWS_INPUT="ci"
fi

if [[ -z "$REPO_DIR" ]]; then
  REPO_DIR=$(pwd)
fi

if ! REPO_DIR=$(cd "$REPO_DIR" 2>/dev/null && pwd -P); then
  err "unable to access repo directory '$REPO_DIR'"
fi

[[ -d "$REPO_DIR" ]] || err "repo path '$REPO_DIR' does not exist"

ensure_tmux_session

require_cmd git
require_cmd gh

git_cmd() {
  git -C "$REPO_DIR" "$@"
}

if [[ -z "$BRANCH" ]]; then
  BRANCH=$(git_cmd rev-parse --abbrev-ref HEAD 2>/dev/null) || err "could not determine current branch"
fi

if ! [[ "$POLL_INTERVAL" =~ ^[0-9]+$ ]] || [[ "$POLL_INTERVAL" -le 0 ]]; then
  err "poll interval must be a positive integer"
fi

REMOTE_URL=$(git_cmd config --get remote.origin.url 2>/dev/null || true)
[[ -z "$REMOTE_URL" ]] && err "could not determine remote 'origin' URL"

REPO_SLUG=$(derive_repo_slug "$REMOTE_URL")
[[ "$REPO_SLUG" == */* ]] || err "remote URL '$REMOTE_URL' does not look like owner/repo"

declare -a WORKFLOWS=()
while IFS= read -r wf; do
  wf_trimmed=$(echo "$wf" | xargs)
  if [[ -n "$wf_trimmed" ]]; then
    WORKFLOWS+=("$wf_trimmed")
  fi
done < <(printf '%s\n' "$WORKFLOWS_INPUT" | tr ',|' '\n')

if [[ ${#WORKFLOWS[@]} -eq 0 ]]; then
  err "provide at least one workflow name"
fi

echo "📝 Staging changes in $REPO_DIR..."
git_cmd add -A

if git_cmd diff --cached --quiet; then
  echo "⚠️  No staged changes found; skipping commit step."
else
  echo "✅ Committing with message: $COMMIT_MESSAGE"
  git_cmd commit -m "$COMMIT_MESSAGE"
fi

echo "⬆️  Pushing branch '$BRANCH' to origin..."
git_cmd push origin "$BRANCH"

if [[ $SHA_PROVIDED -eq 0 ]]; then
  SHA=$(git_cmd rev-parse HEAD 2>/dev/null) || err "could not determine HEAD sha"
fi

echo "📍 Repository : $REPO_SLUG ($REPO_DIR)"
echo "🌿 Branch     : $BRANCH"
echo "🔖 SHA        : $SHA"
echo "🕒 Poll every : ${POLL_INTERVAL}s"
echo "🪟 tmux       : ${TMUX:-"(attached)"}"

for WORKFLOW in "${WORKFLOWS[@]}"; do
  echo "🔎 Waiting for workflow '$WORKFLOW'..."
  RUN_ID=""
  until [[ -n "$RUN_ID" ]]; do
    RUN_ID=$(gh run list \
      --repo "$REPO_SLUG" \
      --workflow "$WORKFLOW" \
      --branch "$BRANCH" \
      --limit 20 \
      --json databaseId,headSha \
      --jq ".[] | select(.headSha == \"$SHA\") | .databaseId" | head -n1) || err "failed to list workflow runs via gh"

    if [[ -z "$RUN_ID" ]]; then
      sleep "$POLL_INTERVAL"
    fi
  done

  echo "▶️  Watching $WORKFLOW (run id $RUN_ID)..."
  start_status_loop "$RUN_ID"
  gh run watch --repo "$REPO_SLUG" --exit-status "$RUN_ID"
  stop_status_loop
done
