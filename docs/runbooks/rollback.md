# Rollback Runbook

If the new container image or slot causes issues, use the following slot-based rollback:

1. **Identify previous image tag**
   - `az webapp deployment container show --name klabo-world-app --resource-group klabo-world-rg --slot staging`
   - Copy the last known-good image (or use `docker images` / GHCR tags).

2. **Reconfigure the staging slot**
   ```bash
   az webapp config container set \
     --name klabo-world-app \
     --resource-group klabo-world-rg \
     --slot staging \
     --docker-custom-image-name ghcr.io/joelklabo/klaboworld:<GOOD_TAG> \
     --docker-registry-server-url https://ghcr.io
   az webapp restart --name klabo-world-app --resource-group klabo-world-rg --slot staging
   ```

3. **Swap staging back into production**
   ```bash
   az webapp deployment slot swap \
     --name klabo-world-app \
     --resource-group klabo-world-rg \
     --slot staging \
     --target-slot production
   ```

4. **Smoke test**
   ```bash
   SMOKE_BASE_URL=https://klabo.world ./scripts/deploy-smoke.sh
   ```

If we ever deploy database migrations:
- Use `az webapp ssh` or Kudu to run `pnpm --filter app exec prisma migrate reset --force` *only if* you need to revert schema/data. For SQLite backups, copy `/site/wwwroot/data/app.db` before overwriting; for PostgreSQL use PITR (see DB recovery runbook).
