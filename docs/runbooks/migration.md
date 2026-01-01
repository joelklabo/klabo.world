# Postgres migration runbook

Use this runbook to move production from the App Service–mounted SQLite database to PostgreSQL Flexible Server. Plan a maintenance window and keep rollback steps ready.

## Preconditions
- PostgreSQL Flexible Server is provisioned (`infra/modules/postgres.bicep`) and reachable from the App Service VNet.
- Prisma datasource provider is set to `postgresql` and merged to `main` before cutover.
- Postgres `DATABASE_URL` stored in Key Vault/App Service settings (stage it on the staging slot first).
- Rollback path confirmed in `docs/runbooks/db-recovery.md` and `docs/runbooks/rollback.md`.

## Dry run (staging or local)
1. **Snapshot SQLite** – download a fresh copy from production (see `docs/runbooks/db-recovery.md`).
2. **Prepare Postgres** – start Postgres locally (`docker compose -f docker-compose.dev.yml up -d db`) or use the staging DB.
3. **Apply schema**:
   ```bash
   DATABASE_URL="<postgres-url>" pnpm --filter app exec prisma migrate deploy
   ```
4. **Import data** (preferred):
   ```bash
   pgloader sqlite:///path/to/app.db "<postgres-url>"
   ```
5. **Verify counts** – compare SQLite vs Postgres for key tables (Admin, Session, Account, RateLimitEntry, VerificationToken).
6. **Smoke test** – `SMOKE_BASE_URL=<staging-url> ./scripts/deploy-smoke.sh`.

## Production cutover
1. **Schedule downtime** – pause admin writes and communicate the window.
2. **Backup SQLite** – capture `/home/site/wwwroot/data/app.db` via Kudu.
3. **Apply schema** – run `prisma migrate deploy` against Postgres using the production `DATABASE_URL`.
4. **Import data** – use `pgloader` (or the approved import tool) with the backup file.
5. **Swap `DATABASE_URL`** – set App Service `DATABASE_URL` to Postgres and remove/disable `ALLOW_SQLITE_IN_PROD`.
6. **Restart + validate** – restart the app, run `scripts/deploy-smoke.sh`, and confirm admin login + content access.

## Rollback
- **Fast revert to SQLite**: restore the SQLite backup to `/home/site/wwwroot/data/app.db`, set `DATABASE_URL=file:/home/site/wwwroot/data/app.db`, restart the app.
- **Postgres rollback**: use PITR on the Flexible Server (see `docs/runbooks/db-recovery.md`).
- **Record evidence**: capture logs/commands in `docs/verifications/`.

## Verification checklist
- [ ] Admin login succeeds and session creation works.
- [ ] Counts match for Admin, Session, Account, RateLimitEntry, VerificationToken.
- [ ] `/api/health` reports DB status `ok`.
