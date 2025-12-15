# Azure App Service Deployment Guide for klabo.world (Next.js)

This repository deploys the `app/` Next.js 16 (App Router) application as a custom container on **Azure App Service for Linux**.

Source of truth for the automated flow:
- `.github/workflows/deploy.yml` (“Build, Test, and Deploy to Azure”)
- `docs/runbooks/deployment.md`
- `pnpm --filter @klaboworld/scripts run deploy` (optional local helper)

## Prerequisites

- Azure CLI installed
- Docker installed (for local builds)
- A container image published to a registry App Service can pull from (GHCR or ACR)
  - If the image is **private** on GHCR, configure registry credentials in App Service (or use ACR with managed identity).
- If using GitHub Actions deployment: repository secret `AZURE_WEBAPP_PUBLISH_PROFILE`

## Canonical resource names (this repo)

The examples below use the production names currently used by this repo:
- Resource group: `klabo-world-rg`
- App Service plan: `klabo-world-plan`
- Web app: `klabo-world-app`
- Slot: `staging`

Adjust as needed for your environment.

## 1) Login and select subscription

```bash
az login
az account list --output table
az account set --subscription "YOUR_SUBSCRIPTION_ID"
az account show --output table
```

## 2) Create the resource group

```bash
az group create \
  --name klabo-world-rg \
  --location westus
```

## 3) Create the App Service plan (Linux)

```bash
az appservice plan create \
  --name klabo-world-plan \
  --resource-group klabo-world-rg \
  --is-linux \
  --sku B1
```

> For production reliability, use a plan that supports **Always On** and configure it (see below).

## 4) Create the Web App for Containers

```bash
az webapp create \
  --resource-group klabo-world-rg \
  --plan klabo-world-plan \
  --name klabo-world-app \
  --deployment-container-image-name "mcr.microsoft.com/appsvc/staticsite:latest"
```

## 5) Configure the container image

Point the app at the published image (example uses GHCR):

```bash
az webapp config container set \
  --name klabo-world-app \
  --resource-group klabo-world-rg \
  --docker-custom-image-name "ghcr.io/YOUR_GITHUB_USERNAME/klaboworld:latest" \
  --docker-registry-server-url "https://ghcr.io"
```

If the GHCR image/package is private, set registry credentials as app settings:

```bash
az webapp config appsettings set \
  --name klabo-world-app \
  --resource-group klabo-world-rg \
  --settings \
    DOCKER_REGISTRY_SERVER_URL="https://ghcr.io" \
    DOCKER_REGISTRY_SERVER_USERNAME="YOUR_GITHUB_USERNAME" \
    DOCKER_REGISTRY_SERVER_PASSWORD="YOUR_GHCR_PAT_WITH_read:packages"
```

## 6) Configure App Settings

### Required (minimum)

These settings are required for the Next.js container to boot and for admin auth to work:

```bash
az webapp config appsettings set \
  --name klabo-world-app \
  --resource-group klabo-world-rg \
  --settings \
    WEBSITES_PORT=8080 \
    PORT=8080 \
    SITE_URL="https://klabo.world" \
    NEXTAUTH_URL="https://klabo.world" \
    NEXTAUTH_SECRET="REPLACE_WITH_RANDOM_SECRET" \
    ADMIN_EMAIL="admin@klabo.world" \
    ADMIN_PASSWORD="REPLACE_WITH_STRONG_PASSWORD_OR_BCRYPT_HASH" \
    DATABASE_URL="file:/home/site/wwwroot/data/app.db" \
    UPLOADS_DIR="/home/site/wwwroot/uploads"
```

Notes:
- `ADMIN_PASSWORD` may be plaintext or a bcrypt hash; the app will hash plaintext automatically on first login attempt.
- `DATABASE_URL` can be a Postgres URL if you later switch to Postgres.

### Observability (recommended)

The admin dashboards use either Log Analytics credentials or App Insights API credentials (set one set or the other):

```bash
az webapp config appsettings set \
  --name klabo-world-app \
  --resource-group klabo-world-rg \
  --settings \
    APPLICATIONINSIGHTS_CONNECTION_STRING="REPLACE_WITH_CONNECTION_STRING" \
    LOG_ANALYTICS_WORKSPACE_ID="REPLACE_WITH_WORKSPACE_ID" \
    LOG_ANALYTICS_SHARED_KEY="REPLACE_WITH_SHARED_KEY"
```

### GitHub integration (optional)

Used by the gist proxy route and content helpers:

```bash
az webapp config appsettings set \
  --name klabo-world-app \
  --resource-group klabo-world-rg \
  --settings \
    GITHUB_TOKEN="REPLACE_WITH_TOKEN" \
    GITHUB_OWNER="joelklabo" \
    GITHUB_REPO="KlaboWorld"
```

## 7) Enable Always On + health checks

To prevent cold/idle stops and to surface failures quickly, enable Always On and configure the health check endpoint:

```bash
az webapp config set \
  --name klabo-world-app \
  --resource-group klabo-world-rg \
  --always-on true \
  --generic-configurations '{\"healthCheckPath\":\"/api/health\"}'
```

## 8) Deploy

### Option A: GitHub Actions (recommended)

On pushes to `main`, `.github/workflows/deploy.yml` will:
- lint + unit test + build
- build/push the container image to GHCR
- deploy the image to Azure App Service
- run `scripts/deploy-smoke.sh` against the Azure host

Ensure `AZURE_WEBAPP_PUBLISH_PROFILE` is set in GitHub repo secrets.

### Option B: Local deploy helper (optional)

Follow `docs/runbooks/deployment.md` and run:

```bash
pnpm --filter @klaboworld/scripts run deploy
```

## 9) Verify

Run the smoke script against production:

```bash
SMOKE_BASE_URL=https://klabo.world ./scripts/deploy-smoke.sh
```

The app health endpoint should return JSON:

```bash
curl -sS https://klabo.world/api/health
```

## Troubleshooting

### Site returns timeouts / no response

1. Restart the web app:
   ```bash
   az webapp restart --name klabo-world-app --resource-group klabo-world-rg
   ```
2. Ensure `PORT` + `WEBSITES_PORT` match the container listener port (`8080` by convention in this repo).

### Get container logs

Enable container logging and download logs:

```bash
az webapp log config --docker-container-logging filesystem \
  --name klabo-world-app \
  --resource-group klabo-world-rg

az webapp log download \
  --name klabo-world-app \
  --resource-group klabo-world-rg \
  --log-file ./webapp_logs.zip
```
