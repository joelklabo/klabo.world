# Security Migration Notes (Next.js)

This repository has migrated from the legacy Swift/Vapor stack to a Next.js + Prisma + NextAuth stack. These notes summarize the current security-relevant behavior and what to configure in production.

## Admin authentication

- Admin auth uses NextAuth Credentials provider.
- The admin user record is stored in the database.
- `ADMIN_PASSWORD` can be provided as plaintext or bcrypt hash; plaintext is hashed before storage.

See `docs/azure/authentication-upgrade.md` for details.

## Production configuration checklist

- [ ] `NEXTAUTH_SECRET` set to a strong random value
- [ ] `NEXTAUTH_URL` set to the production origin (e.g. `https://klabo.world`)
- [ ] `ADMIN_EMAIL` / `ADMIN_PASSWORD` set (treat as secrets)
- [ ] `DATABASE_URL` points at a persistent database (SQLite file under `/home/...` or Postgres)
- [ ] `UPLOADS_DIR` points at persistent storage (`/home/site/wwwroot/uploads` on Azure)

## Observability credentials

If you enable admin dashboards backed by Log Analytics / App Insights APIs, store credentials as secrets:
- `APPLICATIONINSIGHTS_CONNECTION_STRING`
- Either `LOG_ANALYTICS_WORKSPACE_ID` + `LOG_ANALYTICS_SHARED_KEY` or `APPINSIGHTS_APP_ID` + `APPINSIGHTS_API_KEY`

## Recommended hardening (follow-up)

- Put secrets in Key Vault (or at minimum App Service Configuration).
- Restrict access to `/admin` via Entra ID / IP allowlists if needed.
- Add explicit rate limiting around admin login if brute-force risk becomes material.
