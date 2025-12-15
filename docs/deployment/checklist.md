# Deployment Verification Checklist (Next.js)

This checklist is for the current Next.js container deployment (not the legacy Swift/Vapor stack).

## Pre-Deployment

### Local testing
- [ ] `just lint` passes
- [ ] `just test` passes
- [ ] `pnpm --filter app build` succeeds

### Configuration
- [ ] `.env.example` reflects required variables for local dev
- [ ] Production App Settings are configured in Azure (not committed to git)
- [ ] `NEXTAUTH_SECRET` is set to a strong random value in production
- [ ] `ADMIN_EMAIL` / `ADMIN_PASSWORD` are set in production

### Version control
- [ ] Latest changes committed to git
- [ ] On `main` (or a release branch you intend to deploy)
- [ ] No uncommitted changes

## Container Verification (Local)

- [ ] Image builds: `docker build -t klaboworld:local .`
- [ ] Container starts and serves HTTP when `PORT=8080`:
  - [ ] `GET /` returns `200`
  - [ ] `GET /api/health` returns `200`
- [ ] Admin login works at `/admin` (with `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

## Azure Configuration

### App Service plan / web app
- [ ] Linux container web app created
- [ ] Plan supports **Always On**
- [ ] Always On enabled
- [ ] Health check path set to `/api/health`

### App settings (minimum)
- [ ] `WEBSITES_PORT=8080`
- [ ] `PORT=8080`
- [ ] `SITE_URL=https://klabo.world` (or your target)
- [ ] `NEXTAUTH_URL=https://klabo.world` (or your target)
- [ ] `NEXTAUTH_SECRET` set
- [ ] `ADMIN_EMAIL` set
- [ ] `ADMIN_PASSWORD` set (plaintext or bcrypt hash)
- [ ] `DATABASE_URL` set (SQLite file under `/home/...` or Postgres URL)
- [ ] `UPLOADS_DIR=/home/site/wwwroot/uploads`

### Optional but recommended
- [ ] `APPLICATIONINSIGHTS_CONNECTION_STRING` configured
- [ ] Either Log Analytics credentials **or** App Insights API credentials configured for dashboards
- [ ] `GITHUB_TOKEN` configured if `/api/gists` is used (avoids rate limits)

## CI / CD (GitHub Actions)

- [ ] `AZURE_WEBAPP_PUBLISH_PROFILE` secret is set
- [ ] `.github/workflows/deploy.yml` deploy job is green for the target commit

## Post-Deployment Verification

- [ ] Run smoke checks: `SMOKE_BASE_URL=https://klabo.world ./scripts/deploy-smoke.sh`
- [ ] Home page loads
- [ ] Posts index loads
- [ ] Apps index loads
- [ ] Search works
- [ ] Admin login works

## Rollback Plan

If issues occur:
1. [ ] Identify the last known good image tag / commit
2. [ ] Redeploy the last known good image (or re-run the workflow on that commit)
3. [ ] Re-run `scripts/deploy-smoke.sh`
