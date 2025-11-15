#!/usr/bin/env bash
set -euo pipefail

SESSION_NAME="klabo-dev"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ATTACH=1

if [[ "${1:-}" == "--detach" ]]; then
  ATTACH=0
  shift
fi

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux is required. Run ./scripts/install-dev-tools.sh first." >&2
  exit 1
fi

if tmux has-session -t "${SESSION_NAME}" 2>/dev/null; then
  if [[ $ATTACH -eq 1 ]]; then
    echo "tmux session '${SESSION_NAME}' already exists. Attaching..."
    exec tmux attach -t "${SESSION_NAME}"
  else
    echo "tmux session '${SESSION_NAME}' already running. Use 'tmux attach -t ${SESSION_NAME}' to connect.'"
    exit 0
  fi
fi

docker compose -f "${ROOT_DIR}/docker-compose.dev.yml" up -d db redis azurite >/dev/null

tmux new-session -d -s "${SESSION_NAME}" -c "${ROOT_DIR}" "pnpm --filter app dev"
tmux split-window -v -t "${SESSION_NAME}:0.0" -c "${ROOT_DIR}" "pnpm vitest --config vitest.config.ts --watch"
tmux split-window -h -t "${SESSION_NAME}:0.0" -c "${ROOT_DIR}" "docker compose -f docker-compose.dev.yml logs -f db redis azurite"
tmux split-window -h -t "${SESSION_NAME}:0.1" -c "${ROOT_DIR}" "bash"
tmux select-layout -t "${SESSION_NAME}" tiled
tmux select-pane -t "${SESSION_NAME}:0.0"

"${ROOT_DIR}/scripts/maybe-open-dev-browser.sh" &

if [[ $ATTACH -eq 1 ]]; then
  echo "tmux session '${SESSION_NAME}' created. Attach with: tmux attach -t ${SESSION_NAME}"
  tmux attach -t "${SESSION_NAME}"
else
  echo "tmux session '${SESSION_NAME}' started in background. Attach anytime with: tmux attach -t ${SESSION_NAME}"
fi
