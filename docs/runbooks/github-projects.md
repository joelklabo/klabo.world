# GitHub projects showcase

The home page and `/projects` page pull public repo metadata from GitHub (pinned + recently updated). To keep the site resilient to API outages/rate limits—and to keep Playwright deterministic—we also ship a cached snapshot file:

- `app/data/github/<owner>.json`

## Env vars

- `GITHUB_OWNER` (required): GitHub username/org to query.
- `GITHUB_TOKEN` (recommended): Enables pinned repos (GraphQL) and increases API rate limits.

## Refreshing the snapshot locally

```bash
pnpm --filter @klaboworld/scripts run github-snapshot -- --owner "$GITHUB_OWNER" --limit 24
```

This writes `app/data/github/$GITHUB_OWNER.json`.

## Automated refresh (GitHub Actions)

Workflow: “Refresh GitHub projects snapshot” (`.github/workflows/github-snapshot.yml`).

- Runs weekly (and supports manual `workflow_dispatch`).
- Opens a PR if the snapshot changes.
