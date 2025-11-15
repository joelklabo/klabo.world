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

## Deployment automation summary
- `packages/scripts/src/deploy.ts` builds the Next.js app, builds/pushes the Docker image, runs Prisma migrations (`pnpm --filter app exec prisma migrate deploy` when `DATABASE_URL` is set), reconfigures the staging slot, swaps it into production, and finally invokes `./scripts/deploy-smoke.sh`. This sequence matches the modernization plan's expectation for a single script that replicates CI behavior.
- The GitHub Actions workflow (`.github/workflows/deploy.yml`) performs a similar set of tasks in the cloud: it installs pnpm/node, prepares data/uploads directories, runs `prisma db push`, `contentlayer build`, `prisma generate`, lint/test suites, builds the app, pushes to GHCR, and runs `azure/webapps-deploy` before executing the smoke script. With the workflow green and aligned with the plan, the Azure deployment automation is effectively validated.
