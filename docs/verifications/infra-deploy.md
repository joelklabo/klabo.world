# Infra + Deployment Verification (2025-11-15)

## Bicep validation
```
az bicep install
az deployment sub what-if \
  --location westus3 \
  --template-file infra/main.bicep \
  --parameters @infra/envs/prod.json
```
- Result: NO ERRORS (only informational warnings); confirms the modules compile and produce the expected RG/VNet/Storage/ACR/App Service/etc. plan.

## Deployment script dry run
```
CONTAINER_REGISTRY=ghcr.io/joelklabo \
IMAGE_NAME=klaboworld \
IMAGE_TAG=test-$(date +%s) \
AZURE_WEBAPP_NAME=klabo-world-app \
AZURE_RESOURCE_GROUP=klabo-world-rg \
AZURE_SLOT_NAME=staging \
SMOKE_BASE_URL=https://klabo.world \
DATABASE_URL=file:/home/site/wwwroot/data/app.db \
pnpm --filter @klaboworld/scripts run deploy
```
- Verified the script runs locally up to the `docker build` step (pushed changes without actually swapping slots in this environment). CI will execute the same script with real credentials on pushes to `main`.

See `.github/workflows/deploy.yml` for the automated run (it mirrors the commands above and is green as of commit `e03eef9`).
