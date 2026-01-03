# Secrets & Environment Management Runbook

This document describes how we manage secrets across local development, CI, and Azure production for the Next.js stack.

## Environments & Sources
| Environment | Secret Store | Notes |
| --- | --- | --- |
| Local dev | `.env` (gitignored) | Copy `.env.example` → `.env`, `just dev` auto-loads it. Never commit `.env`. |
| CI (`ci.yml`) | GitHub Actions encrypted secrets | Set via repo settings (`Settings → Secrets and variables → Actions`). E.g., `AZURE_WEBAPP_PUBLISH_PROFILE`, `APPLICATIONINSIGHTS_CONNECTION_STRING`, `GITHUB_TOKEN`. |
| Azure App Service | App settings / Key Vault references | Configure via `az webapp config appsettings set ...` or the portal. Prefer Key Vault references for long-lived secrets. |

## Required Secrets
| Key | Purpose | Default / Fallback |
| --- | --- | --- |
| `ADMIN_PASSWORD` | Plain text (dev) or bcrypt hash (prod) for the admin user (use `hash-password` script to generate hashes). | Local default `change-me` provided but **replace in prod**. |
| `NEXTAUTH_SECRET` | Session/JWT encryption for NextAuth. | Auto-generated string for prod; local default `dev-secret`. |
| `DATABASE_URL` | Prisma connection string. | Local default `file:./data/app.db`; set to `file:/home/site/wwwroot/data/app.db` (or Postgres) in Azure. |
| `REDIS_URL` | Rate limiter store. | Leave blank for in-memory; set to `redis://localhost:6379` when running the docker-compose service. |
| `RATE_LIMIT_BYPASS_TOKEN` | Optional admin upload rate limit bypass token (header: `x-rate-limit-bypass`). | Store in Key Vault/App Service settings; rotate regularly. |
| `UPLOADS_DIR` / `AZURE_STORAGE_*` | Control where uploads land. | Local `public/uploads`; prod should point to persistent storage or Blob container. |
| `WEBSITES_ENABLE_APP_SERVICE_STORAGE` | App Service flag that mounts persistent `/home` storage (required for SQLite + uploads). | Set `true` for Linux custom containers; otherwise `/home` is ephemeral. |
| `UPLOADS_QUARANTINE_DIR` / `UPLOADS_QUARANTINE_CONTAINER` | Quarantine destination for uploads awaiting scan. | Defaults to `<UPLOADS_DIR>/quarantine` and `quarantine-uploads`. |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Enables OTel → Azure Monitor. | Optional locally; required in prod for telemetry. |
| `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO` | GitHub Content API credentials for post/app writes in production. | Omit locally to force filesystem writes. |

## Guardrails & Validation
Production boot now enforces safety checks in `loadEnv`:
- `DATABASE_URL` cannot use `file:` SQLite URLs unless `ALLOW_SQLITE_IN_PROD=true`.
- `NEXTAUTH_SECRET` cannot be the dev default (`dev-secret`).
- If `UPLOADS_REQUIRE_DURABLE=true`, then `AZURE_STORAGE_ACCOUNT` + `AZURE_STORAGE_KEY` must be set.

### Azure App Service SQLite exception
When running in Azure App Service (`WEBSITE_SITE_NAME`/`WEBSITE_INSTANCE_ID` set) with `NODE_ENV=production`, `loadEnv` allows SQLite even if `ALLOW_SQLITE_IN_PROD` is unset. It emits a warning so we make an explicit choice:
- Set `ALLOW_SQLITE_IN_PROD=true` to keep SQLite in Azure and silence the warning.
- Set `ALLOW_SQLITE_IN_PROD=false` to **block** SQLite in Azure (fails fast at boot).

If you keep SQLite in Azure, also ensure:
- `WEBSITES_ENABLE_APP_SERVICE_STORAGE=true` so `/home/site/wwwroot` is persisted.
- App Service plan capacity stays at `1` (SQLite is unsafe for multi-instance writes).

### Remediation options (Azure + production)
- Prefer Postgres: point `DATABASE_URL` at Postgres and remove SQLite overrides.
- Allow SQLite explicitly: set `ALLOW_SQLITE_IN_PROD=true` and keep persistence/single instance.
- Force SQLite off: set `ALLOW_SQLITE_IN_PROD=false` to guarantee boot failure on SQLite.

Run the validator locally to catch misconfigurations early:
```bash
NODE_ENV=production pnpm validate:env
```
Uses the repo-pinned toolchain (Node 24.11.1+ and `tsx`) without experimental flags.

## Docker builds (BuildKit secrets)
The Dockerfile requires `NEXTAUTH_SECRET` at build time via a BuildKit secret mount.

```bash
export NEXTAUTH_SECRET=...
docker buildx build --secret id=NEXTAUTH_SECRET,env=NEXTAUTH_SECRET -t klaboworld:local .
```

Notes:
- `.env.local` / `.env.production.local` are not sent to the Docker build context.
- Use `docker buildx create --use` if your Docker install defaults to the legacy builder.

Use these guardrail flags when needed:
- `ALLOW_SQLITE_IN_PROD` (default false): allows SQLite in production for exceptional cases.
- `UPLOADS_REQUIRE_DURABLE` (default false): enforce Azure storage credentials for durable uploads.
- `UPLOADS_SCAN_FAIL_OPEN` (default false): allow fail-open uploads in non-prod; production stays fail-closed.

## Rate limit bypass token
- `RATE_LIMIT_BYPASS_TOKEN` enables an operational bypass for admin upload rate limiting.
- The bypass is only honored with an authenticated admin session and the `x-rate-limit-bypass` header.
- Rotate by updating Key Vault/App Service settings, restart the app, and share the new header value via secure channels only.

## Trusted proxy IP extraction
- `RATE_LIMIT_TRUSTED_PROXY_HOPS` controls how many proxy hops to trust when extracting IPs for rate limit/audit logs.
- Set to `0` to ignore forwarded headers entirely; set to `1+` when running behind a trusted proxy (App Service, CDN).

## Azure Key Vault References
For production, add secrets to Azure Key Vault (one per key), then reference them from App Service app settings:
```bash
az keyvault secret set --vault-name <kv> --name ADMIN-PASSWORD --value '<bcrypt>'
az webapp config appsettings set \
  --name <webapp> --resource-group <rg> \
  --settings ADMIN_PASSWORD=@Microsoft.KeyVault(SecretUri=https://<kv>.vault.azure.net/secrets/ADMIN-PASSWORD/<version>)
```
Repeat for other secrets. App Service handles rotation automatically when you update the Key Vault value.

## GitHub Actions Secrets
Set via repository settings (Actions secrets). Minimum required:
- `AZURE_WEBAPP_PUBLISH_PROFILE`
- `APPLICATIONINSIGHTS_CONNECTION_STRING`
- `GITHUB_TOKEN` (content push scope)

Add others (DB URLs, storage creds) if CI ever needs to run migrations or integration tests hitting Azure resources.

## Fallback Behavior (no GitHub token)
- When `GITHUB_TOKEN` isn’t set **and** `NODE_ENV !== 'production'`, admin CRUD writes directly into `content/{posts,apps}`. This mirrors the legacy “local mode” so new contributors can work offline.
- In production without a token, post/app writes will fail fast (`serviceUnavailable`) to avoid silently diverging from GitHub.

## Rotation Checklist
1. Update the secret in Key Vault (or GitHub Actions for CI-only values).
2. If using App Service app settings directly, reapply via `az webapp config appsettings set ...`.
3. Restart the Web App (`az webapp restart ...`) to ensure environment reload.
4. Verify functionality (admin login, uploads, etc.).

Keep this runbook updated as we add more managed secrets or migrate services.

### Rotating the GitHub Content Token
The production admin UI writes posts/apps through the GitHub Content API. To rotate the PAT it uses:

```bash
# 1. Ensure gh-cli is logged in with a PAT that has repo scope.
gh auth status

# 2. Capture the token without printing it.
NEW_GH_TOKEN=$(gh auth token)

# 3. Update the App Service setting (no output so the token never hits logs).
az webapp config appsettings set \
  --resource-group klabo-world-rg \
  --name klabo-world-app \
  --settings GITHUB_TOKEN=$NEW_GH_TOKEN \
  --output none

# 4. Optionally update any other secret stores (Key Vault, 1Password, etc.).
unset NEW_GH_TOKEN
```

> ℹ️ GitHub reserves the name `GITHUB_TOKEN` for the built-in Actions token, so you cannot create a repository secret with that name. Our deployment workflow uses the default Actions token for GHCR auth, so only the Azure App Service setting needs to change during rotation.
