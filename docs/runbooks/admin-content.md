# Admin Content Runbook

This runbook documents how to manage klabo.world content (posts, apps, uploads) using the Next.js admin interface and supporting scripts. Treat it as the source of truth for day-to-day publishing tasks.

## Prerequisites
- Local services launched with `just dev`. Docker is optional—SQLite (`app/data/app.db`) and the in-memory rate limiter work without Postgres/Redis. Start `docker compose -f docker-compose.dev.yml up -d db redis azurite` only when you explicitly need Redis/Azurite or you have pointed `DATABASE_URL` at Postgres.
- `.env` populated with at least `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXTAUTH_SECRET`, `DATABASE_URL`, `UPLOADS_DIR` (defaults provided in `.env.example`).
- Playwright browsers installed once locally: `cd app && pnpm exec playwright install --with-deps` (useful for smoke testing admin flows).
- Optional Azure storage credentials (`AZURE_STORAGE_ACCOUNT`, `AZURE_STORAGE_KEY`, `AZURE_STORAGE_CONTAINER`) when you want uploads to land in Blob Storage instead of the local `public/uploads` directory.

## Starting the Admin Stack
1. From the repo root, run `just dev` (or `./scripts/tmux-dev.sh` for the tmux workflow). This:
   - Boots Postgres/Redis/Azurite containers when Docker is available (Skipped otherwise).
   - Starts `pnpm --filter app dev`.
   - Optionally launches your browser at `http://localhost:3000` and `/admin` when `AUTO_OPEN_BROWSER=true`.
2. Visit `http://localhost:3000/admin` and log in using the credentials defined in `.env` (defaults `admin@example.com / change-me`).
3. The dashboard lists all posts (published + drafts). Use the navigation pills for Compose, Apps, and Dashboards.

## Managing Posts
### Create
1. Click **Compose** → fill Title, Summary, Tags, Publish Date, Featured Image, and Markdown body.
2. Use the **Upload image** button to drop files; the helper returns a URL you can paste into the Featured Image or Markdown.
3. Publish immediately by submitting the form (drafts are supported by leaving Publish Date blank).
4. The server action persists to:
   - GitHub content repo when `NODE_ENV=production && GITHUB_TOKEN` is configured.
   - `content/posts/*.mdx` locally otherwise.
5. After save, the dashboard revalidates `/`, `/posts`, `/posts/:slug`, and the feeds automatically.

### Edit/Delete
- From `/admin`, click **Edit** for any post. Changes overwrite the MDX/GitHub file. Delete uses a secondary POST button and removes the source file.
- All post actions trigger Playwright coverage in `app/tests/e2e/admin-content.e2e.ts`—run `cd app && pnpm exec playwright test tests/e2e/admin-content.e2e.ts` before pushing.

## Managing Apps
### Create/Edit
1. Navigate to **Apps → New app**.
2. Provide metadata (name, optional slug, version, publish date, description, features, links, icon path, screenshots).
3. Upload icons/screenshots via the helper; paste returned URLs into the fields.
4. Save to write `content/apps/<slug>.json` locally or via GitHub.
5. Editing uses the same form (`/admin/apps/[slug]/edit`).
6. Delete uses the `Delete app` button (server action removes the JSON file).
7. Playwright smoke: `app/tests/e2e/admin-apps.e2e.ts`.

## Managing Contexts (retired)
The contexts feature was removed on 2025-12-02. Existing pages/routes are gone; author only posts/apps/dashboards going forward.

## Monitoring Dashboards
1. Navigate to **Dashboards** in the admin navigation to view existing panels or click **New dashboard** to add one.
2. Each dashboard writes an MDX file under `content/dashboards/<slug>.mdx`. The front matter controls behavior:
   - `panelType`: `chart`, `logs`, `embed`, or `link`.
   - Optional fields: `chartType`, `kqlQuery`, `iframeUrl`, `externalUrl`, `refreshIntervalSeconds`, `tags`.
   - Body text beneath `---` becomes the runbook/notes shown in the admin UI.
3. Panel validation rules:
   - `chart`/`logs` panels **must** include `kqlQuery`. The server action rejects submissions without it.
   - `embed` panels require `iframeUrl` (https:// only).
   - `link` panels require `externalUrl` (used to render the CTA button + hostname preview).
4. Charts/logs call Azure Log Analytics via `runLogAnalyticsQuery`, so set `LOG_ANALYTICS_WORKSPACE_ID` and `LOG_ANALYTICS_SHARED_KEY` wherever you expect them to work (production mandatory, local optional). Panels gracefully render an empty state if those env vars are missing.
5. The dashboard detail page renders:
   - Live chart or log preview (with manual refresh + severity/search filters for logs).
   - Embed iframe or link CTA when applicable.
   - Full configuration form + Markdown notes (with preview + upload helpers).
6. Delete buttons remove the MDX file (local or GitHub depending on environment). As with other admin actions, Playwright coverage belongs in `app/tests/e2e/admin-content.e2e.ts` until dedicated specs are added.

## Uploads Cheat Sheet
- Local dev: files land under `public/uploads`. The helper auto-builds URLs like `/uploads/<uuid>.png` (immediately available because `public/` is statically served).
- Azure production: set `AZURE_STORAGE_ACCOUNT`, `AZURE_STORAGE_KEY`, `AZURE_STORAGE_CONTAINER` (defaults to `uploads`). URLs will be full blob URLs.
- Limits: 10 MB max size; MIME types restricted to JPEG/PNG/GIF/WebP.
- Rate limit bypass (ops only): set `RATE_LIMIT_BYPASS_TOKEN` and send `x-rate-limit-bypass` with an authenticated admin session; rotate the token per `docs/runbooks/secrets.md`.
- For audit-friendly IPs, set `RATE_LIMIT_TRUSTED_PROXY_HOPS` to match your trusted proxy chain.

## Markdown Preview
- Compose/edit screens include a **Preview Markdown** button powered by `/admin/markdown-preview`. Use it to sanity-check embeddings before publishing.
- Preview uses the same renderer as the public site (`renderMarkdownPreview`); this ensures parity across admin and front-end.

## GitHub Integration Notes
- When `GITHUB_TOKEN`, `GITHUB_OWNER`, and `GITHUB_REPO` are configured AND `NODE_ENV=production`, admin write/delete operations go through the GitHub Content API (matching the legacy GitHubService behavior). Local development without a token falls back to writing inside `content/` directly.
- Uploaded posts/apps survive container restarts because Azure mounts the uploads directory (configure `UPLOADS_DIR` accordingly in App Service settings).

## Verification Flow Before Deploying
1. `pnpm turbo lint`
2. `pnpm turbo test`
3. `cd app && PLAYWRIGHT_BASE_URL=http://localhost:3000 ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=change-me pnpm exec playwright test tests/e2e/admin-content.e2e.ts tests/e2e/admin-apps.e2e.ts`
4. Optional local smoke: `./scripts/deploy-smoke.sh` (set `SMOKE_BASE_URL=http://localhost:3000`).

## Troubleshooting
- **Login fails**: ensure `ADMIN_EMAIL`/`ADMIN_PASSWORD` match a seeded admin. Delete the `Admin` table row or update via Prisma if needed.
- **Uploads fail**: check `UPLOADS_DIR` permissions; inspect `app/src/lib/uploads.ts` logs. For Azure, verify storage env vars and container name.
- **GitHub errors**: confirm Content API token scopes (repo contents) and that the configured owner/repo exist.
- **Playwright**: delete `app/test-results` and re-run with `DEBUG=pw:api` for verbose logs.

Keep this runbook updated whenever admin workflows change.
