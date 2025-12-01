# Azure Infrastructure as Code (Bicep)

The `infra/` folder contains the subscription-scoped Bicep templates for provisioning klabo.world in Azure. Use this alongside the live deployment guides in `docs/azure/deployment-guide.md` and `docs/deployment/staging-strategy.md` (slot-first flow used by the “Build, Test, and Deploy to Azure” workflow).

## Layout

```
infra/
├── main.bicep              # subscription deployment entry point
├── envs/
│   └── prod.json           # sample parameter file (copy + customize per environment)
└── modules/
    ├── network.bicep       # VNet, subnets, Private DNS
    ├── storage.bicep       # StorageV2 account + blob containers
    ├── acr.bicep           # Azure Container Registry
    ├── keyvault.bicep      # Key Vault + access policies
    ├── redis.bicep         # Azure Cache for Redis
    ├── postgres.bicep      # PostgreSQL Flexible Server
    ├── monitoring.bicep    # Log Analytics + Application Insights
    ├── appService.bicep    # App Service plan + Web App (staging slot)
    └── cdn.bicep           # Azure CDN profile/endpoint
```

## Prerequisites

- Azure CLI 2.79+
- Bicep CLI 0.26+ installed via `az bicep install` (or `brew install bicep`).
- Logged in to the target subscription: `az account set -s <subscriptionId>`.
- For secure parameters (`postgresAdminPassword`), either edit a copy of the JSON param file locally or pass them via `--parameters postgresAdminPassword=...` at runtime.

## Deployment

```bash
# validate
az deployment sub what-if \
  --location westus3 \
  --template-file infra/main.bicep \
  --parameters @infra/envs/prod.json

# deploy
az deployment sub create \
  --location westus3 \
  --template-file infra/main.bicep \
  --parameters @infra/envs/prod.json
```

The deployment outputs include the resource group ID, VNet ID, storage account ID, and web app ID—capture those values for future references (GitHub secrets, runbooks, etc.).

> **Notes**
> - Default app runtime uses SQLite at `file:/home/site/wwwroot/data/app.db`; Postgres is provisioned but not yet the primary. Populate `DATABASE_URL` with the Postgres connection string when you’re ready to migrate.
> - Blob uploads default to Azure Storage; set `AZURE_STORAGE_ACCOUNT`, `AZURE_STORAGE_KEY`, and `AZURE_STORAGE_CONTAINER` in App Service settings. If absent, uploads write to `public/uploads` on the container FS (non-durable).
> - The GitHub Actions deploy workflow builds/pushes the container and runs `scripts/deploy-smoke.sh`; keep parameter files in `infra/envs/` in sync with App Service settings.
