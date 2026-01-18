# Learnings

<!-- Capture learnings as we go. Format:
## YYYY-MM-DD - Topic
**Type:** GOTCHA | DISCOVERY | WORKAROUND | RETRY
**Context:** What happened
**Learning:** What we learned
**Integrate:** yes | no | review
-->

## 2026-01-17 - Docker Desktop requires manual launch
**Type:** GOTCHA
**Context:** Docker Desktop installed via Homebrew but `docker` command not available
**Learning:** After installing Docker Desktop, must open the app manually to start Docker daemon
**Integrate:** yes

## 2026-01-17 - Contentlayer must be built before dev server
**Type:** GOTCHA
**Context:** Server returned 500 with "Module not found: Can't resolve 'contentlayer/generated'"
**Learning:** Run `pnpm contentlayer build` before starting dev server to generate content types
**Integrate:** yes

## 2026-01-17 - Homebrew Docker install needs sudo for cli-plugins
**Type:** WORKAROUND
**Context:** `brew install --cask docker` fails with sudo password required
**Learning:** Create `/usr/local/cli-plugins` manually with sudo before installing, or copy Docker.app directly from mounted DMG
**Integrate:** yes
