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
| `ADMIN_PASSWORD` | bcrypt hash for the admin user (generated via `pnpm --filter app exec prisma db seed` or `hash-password` script). | Local default `change-me` provided but **replace in prod**. |
| `NEXTAUTH_SECRET` | Session/JWT encryption for NextAuth. | Auto-generated string for prod; local default `dev-secret`. |
| `DATABASE_URL` | Prisma connection string. | Docker Postgres in dev; Azure flexible server in prod. |
| `REDIS_URL` | Rate limiter store. | Docker Redis in dev. |
| `UPLOADS_DIR` / `AZURE_STORAGE_*` | Control where uploads land. | Local `public/uploads`; prod should point to persistent storage or Blob container. |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Enables OTel → Azure Monitor. | Optional locally; required in prod for telemetry. |
| `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO` | GitHub Content API credentials for post/app/context writes in production. | Omit locally to force filesystem writes. |

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
- When `GITHUB_TOKEN` isn’t set **and** `NODE_ENV !== 'production'`, admin CRUD writes directly into `content/{posts,apps,contexts}`. This mirrors the legacy “local mode” so new contributors can work offline.
- In production without a token, post/app/context writes will fail fast (`serviceUnavailable`) to avoid silently diverging from GitHub.

## Rotation Checklist
1. Update the secret in Key Vault (or GitHub Actions for CI-only values).
2. If using App Service app settings directly, reapply via `az webapp config appsettings set ...`.
3. Restart the Web App (`az webapp restart ...`) to ensure environment reload.
4. Verify functionality (admin login, uploads, etc.).

Keep this runbook updated as we add more managed secrets or migrate services.
