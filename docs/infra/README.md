# Azure Infrastructure as Code (Bicep)

The `infra/` folder contains the subscription-scoped Bicep templates for provisioning klabo.world in Azure. Deployments follow the workflow described in `docs/modernization-plan.md` §3.1.

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

> **Note:** The current production stack still uses SQLite; the PostgreSQL module provisions the flexible server ahead of that migration so connection strings are ready when we flip Prisma to Postgres.
