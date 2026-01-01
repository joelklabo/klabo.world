# Database Recovery Runbook

Current production still uses the App Service–mounted SQLite file (`/home/site/wwwroot/data/app.db`). PostgreSQL Flexible Server is provisioned via Bicep for the future. Cover both cases:

## SQLite (current)
1. **Snapshot** – copy out the current DB before making changes:
   ```bash
   az webapp deployment list-publishing-profiles --name klabo-world-app --resource-group klabo-world-rg -o tsv \
     --query "[?publishMethod=='ZipDeploy'].[publishUrl,userName,userPWD]"
   curl -u "$USER:$PWD" \
     https://klabo-world-app.scm.azurewebsites.net/api/vfs/site/wwwroot/data/app.db \
     -o backup-$(date +%Y%m%d-%H%M).db
   ```
2. **Restore** – upload a known-good copy:
   ```bash
   curl -X PUT -u "$USER:$PWD" \
     -H "If-Match: *" -H "Content-Type: application/octet-stream" \
     --data-binary @backup.db \
     https://klabo-world-app.scm.azurewebsites.net/api/vfs/site/wwwroot/data/app.db
   ```
3. **Restart & smoke test** – `az webapp restart …` then `SMOKE_BASE_URL=… ./scripts/deploy-smoke.sh`.

## PostgreSQL Flexible Server (future)
1. **PITR** – use Azure Portal or CLI:
   ```bash
   az postgres flexible-server restore \
     --name pg-klaboworld-restore \
     --resource-group klaboworld-rg \
     --source-server pg-klaboworld \
     --restore-time "2025-11-15T11:00:00Z"
   ```
2. **Swap connection string** – update Key Vault secret / App Service setting `DATABASE_URL` to point at the restored server.
3. **Re-seed admin** – the app automatically seeds `Admin` when it boots, but you can run `pnpm --filter app exec prisma db push` and `pnpm --filter @klaboworld/scripts run create-admin` if necessary.
4. **Cleanup** – once satisfied, delete the temporary restore server, or use it to replace the primary.

### Migration rollback notes
- If a Postgres cutover fails, revert to the SQLite backup and set `DATABASE_URL=file:/home/site/wwwroot/data/app.db`, then restart the app.
- For Postgres rollback, use PITR (step 1) and then swap the connection string.
- See `docs/runbooks/migration.md` for the full cutover checklist.

Always capture evidence (timestamps, command logs) in `docs/verifications/` after recovery exercises.
