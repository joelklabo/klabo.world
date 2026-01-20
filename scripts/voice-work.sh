#!/bin/bash
set -euo pipefail

usage() {
  echo "Usage: $0 --file content/posts/<draft>.mdx"
}

FILE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --file)
      FILE="$2"; shift 2;;
    -h|--help)
      usage; exit 0;;
    *)
      echo "Unknown arg: $1"; usage; exit 1;;
  esac
done

if [[ -z "${FILE}" ]]; then
  usage; exit 1
fi

REPO_ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$REPO_ROOT"

# 1) Refresh voice artifacts
pnpm --filter @klaboworld/scripts run voice:profile
pnpm --filter @klaboworld/scripts run voice:guide

# 2) Rewrite draft via Codex (full file output)
TMP_OUT=$(mktemp)
PROMPT=$(cat <<'EOF'
Rewrite the following MDX blog post in Joel's voice.

Constraints:
- Output ONLY the full MDX file contents.
- Preserve the YAML frontmatter keys/values exactly (do not add publishDate).
- Preserve any <figure> blocks as-is.
- Prefer Joel's style: concrete, direct, short punchy lines, no generic puffery.
- Keep headings and overall structure similar, but tighten wording.

EOF
)

# Codex reads repo context; we pass the file content explicitly.
CONTENT=$(cat "$FILE")

printf "%s\n\n---BEGIN_INPUT---\n%s\n---END_INPUT---\n" "$PROMPT" "$CONTENT" | codex exec - > "$TMP_OUT"

# Sanity check: frontmatter must remain.
if ! head -n 1 "$TMP_OUT" | rg -q '^---$'; then
  echo "Codex output did not look like MDX with frontmatter; aborting. Output at: $TMP_OUT" >&2
  exit 1
fi

cp "$TMP_OUT" "$FILE"
rm -f "$TMP_OUT"

# 3) Lint the rewritten draft
pnpm --filter @klaboworld/scripts run voice:check -- --file "$FILE" | sed -n '1,220p'

# 4) Start public dev server and print URL
URL=$(./scripts/print-dev-url.sh "${PORT:-3000}")
echo "Preview URL: ${URL}"
echo "Run: ./scripts/dev-public.sh (in another terminal)"
