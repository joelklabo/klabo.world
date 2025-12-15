# Admin Authentication (Next.js)

This repo uses **NextAuth (Credentials provider)** for admin authentication. The legacy Swift/Vapor auth system is retired; the current implementation lives in the Next.js app.

## How it works

- Admin auth is handled by NextAuth (`app/src/lib/authOptions.ts`).
- The admin account is stored in the database via Prisma (`Admin` table).
- On login attempts, the app ensures an admin record exists by upserting `ADMIN_EMAIL` with a bcrypt-hashed password derived from `ADMIN_PASSWORD`:
  - If `ADMIN_PASSWORD` is already a bcrypt hash, it is used as-is.
  - If it is plaintext, it is hashed before storing.

Code references:
- `app/src/lib/authOptions.ts`
- `app/src/lib/auth.ts`
- `app/src/app/api/auth/[...nextauth]/route.ts`

## Required environment variables

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

## Quick start (local)

```bash
cp .env.example .env
# set ADMIN_EMAIL, ADMIN_PASSWORD, NEXTAUTH_SECRET in .env
just dev
```

- Visit `http://localhost:3000/admin`
- Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`

## Production notes (Azure App Service)

- Set the same variables in App Service **Configuration → Application settings**.
- Use a strong `NEXTAUTH_SECRET` (random, long).
- `NEXTAUTH_URL` should match your production origin (e.g. `https://klabo.world`).
- Keep `ADMIN_PASSWORD` rotated and treat it as a secret (Key Vault or App Settings).
