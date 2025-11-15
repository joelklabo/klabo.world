
```
just bootstrap
mise install
mise all tools are installed
corepack enable
corepack prepare pnpm@10.22.0 --activate
Preparing pnpm@10.22.0 for immediate activation...
npm config set fund false
pnpm install --ignore-scripts
 WARN  Unsupported engine: wanted: {"node":">=24.11.1"} (current: {"node":"v24.2.0","pnpm":"10.22.0"})
Scope: all 5 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date

Done in 521ms using pnpm v10.22.0
```

```
just doctor

  System:
    OS: macOS 26.0
    CPU: (10) arm64 Apple M1 Pro
    Memory: 226.69 MB / 16.00 GB
    Shell: 5.9 - /bin/zsh
  Binaries:
    Node: 24.2.0 - /opt/homebrew/bin/node
    npm: 11.3.0 - /opt/homebrew/bin/npm
    pnpm: 10.22.0 - /opt/homebrew/bin/pnpm
  Browsers:
    Chrome: 142.0.7444.162
    Safari: 26.0

docker compose -f docker-compose.dev.yml ps
time="2025-11-15T10:52:52-08:00" level=warning msg="/Users/honk/code/klabo.world/docker-compose.dev.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion"
NAME                   IMAGE                                            COMMAND                  SERVICE   CREATED        STATUS                  PORTS
klaboworld-azurite-1   mcr.microsoft.com/azure-storage/azurite:3.33.0   "docker-entrypoint.s…"   azurite   19 hours ago   Up 19 hours             0.0.0.0:10000->10000/tcp, [::]:10000->10000/tcp, 10001-10002/tcp
klaboworld-db-1        postgres:17.6                                    "docker-entrypoint.s…"   db        19 hours ago   Up 19 hours (healthy)   0.0.0.0:5432->5432/tcp, [::]:5432->5432/tcp
klaboworld-redis-1     redis:7.4-alpine                                 "docker-entrypoint.s…"   redis     19 hours ago   Up 19 hours (healthy)   0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp
```
