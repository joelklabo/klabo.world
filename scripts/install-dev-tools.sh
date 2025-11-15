#!/usr/bin/env bash
set -euo pipefail

TOOLS=(
  tmux
)

if ! command -v brew >/dev/null 2>&1; then
  echo "❌ Homebrew is required to install dev tools automatically." >&2
  echo "Please install Homebrew from https://brew.sh/ and re-run this script." >&2
  exit 1
fi

for tool in "${TOOLS[@]}"; do
  if command -v "$tool" >/dev/null 2>&1; then
    echo "✅ $tool already installed"
    continue
  fi
  echo "➡️  Installing $tool via Homebrew..."
  brew install "$tool"
done

echo "✅ Development tools ready."
