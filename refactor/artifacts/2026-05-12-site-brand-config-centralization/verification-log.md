# Verification Log — Centralize shared site constants and identity-derived literals

## Commands executed
- `rg -n "pay\\.klabo\\.world|klabo\\.world|joel@klabo\\.world|klabo\\.world:" ...`
- `git diff -- app/src/lib/site-config.ts ...` (changed files in this pass)
- `git status --short` (pre-commit check)
