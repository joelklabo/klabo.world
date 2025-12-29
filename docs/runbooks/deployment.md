# Deployment Runbook

The automation is codified in two places:
1. `packages/scripts/src/deploy.ts` (`pnpm --filter @klaboworld/scripts run deploy`)
2. `.github/workflows/deploy.yml` (“Build, Test, and Deploy to Azure” workflow)

Follow the same steps locally or in CI:

1. **Prereqs**
   - Azure CLI logged in with access to `klabo-world-rg` (or federated creds in CI).
   - Docker logged into `ghcr.io/${ORG}` (`docker login ghcr.io`).
   - CI GHCR auth uses `GITHUB_TOKEN` (actor = `github.actor`, needs `packages: write`). If a PAT is required, update `.github/workflows/deploy.yml` to use `GHCR_USERNAME` + `GHCR_PAT`.
   - Environment variables exported:
     ```
     export CONTAINER_REGISTRY=ghcr.io/joelklabo
     export IMAGE_NAME=klaboworld
     export IMAGE_TAG=$(git rev-parse HEAD)
     export AZURE_WEBAPP_NAME=klabo-world-app
     export AZURE_RESOURCE_GROUP=klabo-world-rg
     export AZURE_SLOT_NAME=staging
     export DATABASE_URL=file:/home/site/wwwroot/data/app.db   # or postgres URL
     export SMOKE_BASE_URL=https://klabo.world
     ```
2. **Build & push** – run the script:
   ```bash
   pnpm --filter @klaboworld/scripts run deploy
   ```
   It will:
   - `pnpm --filter app build`
   - `docker build -t ${IMAGE} .` + `docker push`
   - `pnpm --filter app exec prisma migrate deploy` when `DATABASE_URL` is set
   - `az webapp config container set …` to point the staging slot at the new image
   - Restart the slot and swap into production
   - Execute `scripts/deploy-smoke.sh` against `SMOKE_BASE_URL`
3. **CI** – `deploy.yml` performs the same steps automatically on pushes to `main` using federated creds (`AZURE_CLIENT_ID/TENANT_ID/SUBSCRIPTION_ID`) and secrets (`DATABASE_URL`).

> **Note**: If we eventually move to PostgreSQL Flexible Server, just update `DATABASE_URL` for the CLI/CI environment before running the script; the workflow already handles it.

## Custom Domains (Aliases)

To add an alias domain (e.g. `klabo.blog`) that points at the App Service and then redirects to `https://klabo.world`, you need **both** DNS updates and App Service hostname bindings.

1. **DNS provider** (outside Azure in this repo):
   - `klabo.blog` → A record to the App Service external IP:
     ```bash
     az webapp config hostname get-external-ip --resource-group klabo-world-rg --webapp-name klabo-world-app
     ```
   - `www.klabo.blog` → CNAME to `klabo-world-app.azurewebsites.net`
   - Add the TXT ownership records (value is the web app verification id):
     ```bash
     az webapp show --resource-group klabo-world-rg --name klabo-world-app --query customDomainVerificationId -o tsv
     ```
     Create:
     - `asuid.klabo.blog` TXT → `<customDomainVerificationId>`
     - `asuid.www.klabo.blog` TXT → `<customDomainVerificationId>`

2. **Bind hostnames** (after DNS propagates):
   ```bash
   az webapp config hostname add --resource-group klabo-world-rg --webapp-name klabo-world-app --hostname klabo.blog
   az webapp config hostname add --resource-group klabo-world-rg --webapp-name klabo-world-app --hostname www.klabo.blog
   ```

3. **Managed TLS**:
   ```bash
   az webapp config ssl create --resource-group klabo-world-rg --name klabo-world-app --hostname klabo.blog
   az webapp config ssl create --resource-group klabo-world-rg --name klabo-world-app --hostname www.klabo.blog
   ```
   Confirm `SslState=SniEnabled` via:
   ```bash
   az webapp config hostname list --resource-group klabo-world-rg --webapp-name klabo-world-app --output table
   ```
