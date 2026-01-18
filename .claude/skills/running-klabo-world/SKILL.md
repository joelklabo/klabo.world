---
name: running-klabo-world
description: Starts and monitors the klabo.world development server with all dependencies. Use when running the server, managing drafts, starting dev environment, or debugging startup issues. ALWAYS keep the server running and respond immediately to errors.
invocation: user
---

# Running klabo.world

## CRITICAL: Server Monitoring Protocol

**ALWAYS follow these rules when the server is running:**

1. **Run server in background** with output file monitoring
2. **Check logs immediately** after any file change or user action
3. **Auto-restart on crash** - never leave server down
4. **Read full error output** when server fails
5. **Fix errors proactively** before user asks

### Starting with Monitoring

```bash
# Start server in background
cd /Users/klabo/Documents/klabo.world/app
pnpm dev 2>&1  # Run as background task

# Monitor logs continuously
tail -f /private/tmp/claude/-Users-klabo-Documents/tasks/<task-id>.output
```

### On Server Crash

1. **Read the crash output immediately**
2. **Identify the error** (check last 50 lines)
3. **Fix the root cause** (env vars, missing files, syntax errors)
4. **Restart the server**
5. **Verify with health check**: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/`

### Common Crash Causes

| Error | Cause | Fix |
|-------|-------|-----|
| `ENV validation failed` | Invalid env var format | Check `.env` - emails need valid format like `user@domain.tld` |
| `Port in use` | Old server still running | `pkill -f "next dev"; rm -rf .next/dev/lock` |
| `lock file` | Stale lock | `rm -rf .next/dev/lock` |
| `ENOENT contentlayer` | Missing build | `pnpm contentlayer build` |
| Duplicate `app/` directory | Nested folder conflict | `rm -rf app/` (removes duplicate, not src/app) |

## Quick Reference

| Task | Command |
|------|---------|
| Full dev start | `just dev` |
| Next.js only | `pnpm --filter app dev` |
| Docker services | `docker compose -f docker-compose.dev.yml up -d db redis azurite` |
| Health check | `just doctor` |
| Create draft | `node packages/content/dist/cli/bin.js draft create -t "Title" -s "Summary"` |
| List drafts | `node packages/content/dist/cli/bin.js draft list` |
| Publish draft | `node packages/content/dist/cli/bin.js draft publish <slug>` |

## Prerequisites

- **Node.js:** v24.11.1+ (check `.nvmrc`)
- **pnpm:** v10.22.0+ (install: `npm install -g pnpm`)
- **Docker Desktop:** Required for database, Redis, Azurite
- **mise:** Optional, used by Justfile for version management

## Workflow

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Approve build scripts** (interactive prompt):
   ```bash
   pnpm approve-builds
   ```
   Select all packages (press `a`), then confirm with `y`.

3. **Start Docker Desktop:**
   ```bash
   open -a Docker
   ```
   Wait for Docker daemon to be ready.

4. **Start Docker services:**
   ```bash
   docker compose -f docker-compose.dev.yml up -d db redis azurite
   ```

5. **Set up database:**
   ```bash
   cd app && pnpm prisma generate && pnpm prisma db push
   ```

6. **Build contentlayer:**
   ```bash
   pnpm contentlayer build
   ```

7. **Start dev server:**
   ```bash
   pnpm --filter app dev
   ```

8. **Verify:** Open http://localhost:3000

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `pnpm: command not found` | `npm install -g pnpm` |
| `docker: command not found` | Install Docker Desktop, then open it |
| Node version warning | Install Node 24.11.1 via nvm or mise |
| Build scripts not running | Run `pnpm approve-builds` and select all |
| `Module not found: contentlayer/generated` | Run `pnpm contentlayer build` |
| Homebrew Docker install fails (sudo) | Run `sudo mkdir -p /usr/local/cli-plugins` first |
| 500 error on homepage | Check server logs, usually missing contentlayer build |
| CLI: `mkdir /content` error | Run CLI from monorepo root, not app subdirectory |
| Draft not visible after create | Run `pnpm contentlayer build` in app directory |
| CLI `require` ESM error | Rebuild CLI: `cd packages/content && pnpm build` |

## Services

| Service | Port | Purpose |
|---------|------|---------|
| Next.js | 3000 | Web app |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Caching |
| Azurite | 10000 | Azure blob storage emulator |

## Content Management CLI

The `packages/content` package provides CLI tools for draft management with JSON output optimized for LLM usage.

### Draft Commands

```bash
# Run from monorepo root
cd /Users/klabo/Documents/klabo.world

# Create a draft
node packages/content/dist/cli/bin.js draft create -t "Title" -s "Summary" -b ./content.md

# Update a draft
node packages/content/dist/cli/bin.js draft update <slug> --title "New Title" -b ./updated.md

# Get draft details
node packages/content/dist/cli/bin.js draft get <slug>

# List all drafts
node packages/content/dist/cli/bin.js draft list

# Publish a draft
node packages/content/dist/cli/bin.js draft publish <slug>

# Unpublish (revert to draft)
node packages/content/dist/cli/bin.js draft unpublish <slug>

# Delete a draft
node packages/content/dist/cli/bin.js draft delete <slug> --force
```

### Image Upload

```bash
node packages/content/dist/cli/bin.js image upload ./image.png --alt "Description"
```

### Output Format

All commands return JSON with `nextActions` for LLM guidance:
```json
{
  "success": true,
  "data": { "slug": "my-post", "previewUrl": "http://localhost:3000/drafts/my-post" },
  "nextActions": [
    { "action": "kw draft publish my-post", "description": "Publish the draft" }
  ]
}
```

### Rebuilding After Changes

After creating/updating drafts, rebuild contentlayer:
```bash
cd app && pnpm contentlayer build
```

## MCP Server Integration

The MCP server provides content management tools for Claude Desktop integration.

### MCP Server Setup

**1. Build the MCP server:**
```bash
cd /Users/klabo/Documents/klabo.world/packages/content && pnpm build
```

**2. Configure Claude Desktop** - Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "klaboworld": {
      "command": "node",
      "args": ["/Users/klabo/Documents/klabo.world/packages/content/dist/mcp/server.js"],
      "cwd": "/Users/klabo/Documents/klabo.world"
    }
  }
}
```

**3. Restart Claude Desktop** to load the MCP server.

### MCP Server Monitoring

| Check | Command |
|-------|---------|
| Test MCP server | `node packages/content/dist/mcp/server.js` (should output "MCP server running") |
| Verify build | `ls packages/content/dist/mcp/server.js` |
| Rebuild after changes | `cd packages/content && pnpm build` |

### Available MCP Tools

| Tool | Purpose |
|------|---------|
| `kw_draft_create` | Create new draft |
| `kw_draft_update` | Update existing draft |
| `kw_draft_get` | Get draft by slug |
| `kw_draft_list` | List all drafts |
| `kw_draft_delete` | Delete a draft |
| `kw_draft_publish` | Publish a draft |
| `kw_image_upload` | Upload image (base64) |

### MCP Server Troubleshooting

| Issue | Fix |
|-------|-----|
| "Module not found" | Rebuild: `cd packages/content && pnpm build` |
| Tools not available in Claude | Restart Claude Desktop |
| SDK import errors | `pnpm install` in packages/content |

## File Change Protocol

When ANY file changes that affects the server:

### Automatic (Turbopack handles)
- `.tsx`, `.ts`, `.css` files in `src/` - hot reload
- Component changes - fast refresh

### Manual Rebuild Required
| Change | Action |
|--------|--------|
| `.env` file | Restart server: `pkill -f "next dev" && pnpm dev` |
| `contentlayer.config.ts` | `pnpm contentlayer build` then restart |
| Content files (`.mdx`) | `pnpm contentlayer build` |
| `package.json` | `pnpm install` then restart |
| `next.config.ts` | Restart server |
| Prisma schema | `pnpm prisma generate && pnpm prisma db push` |

### After Any Edit
1. Check server logs for errors
2. If error appears, fix immediately
3. Verify page still loads: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/`

## Admin Login

**Credentials (local dev):**
- Email: `admin@local.dev`
- Password: `localdevpassword`

**Login URL:** http://localhost:3000/admin

**If login fails**, manually seed the admin:
```bash
cd /Users/klabo/Documents/klabo.world/app && node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function seed() {
  const hash = await bcrypt.hash('localdevpassword', 10);
  await prisma.admin.upsert({
    where: { email: 'admin@local.dev' },
    create: { email: 'admin@local.dev', passwordHash: hash },
    update: { passwordHash: hash }
  });
  console.log('Admin seeded');
  await prisma.\\\$disconnect();
}
seed();
"
```

## Learnings

- `ADMIN_EMAIL` must be valid email format (e.g., `admin@local.dev` not `admin@localhost`)
- Duplicate `app/` directory at project root breaks all routing - delete it if found
- Always run CLI commands from monorepo root, not app subdirectory
- Admin auto-seeding may fail silently - manually seed if login doesn't work
