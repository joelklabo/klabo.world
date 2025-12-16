set shell := ["/bin/bash", "-c"]

# Helper to ensure corepack + pnpm versions match .tool-versions
bootstrap:
	mise install
	mise exec -- corepack enable
	mise exec -- corepack prepare pnpm@10.22.0 --activate
	mise exec -- npm config set fund false
	mise exec -- pnpm install --ignore-scripts

# Start local services + dev server
alias dev := run-dev
run-dev:
	docker compose -f docker-compose.dev.yml up -d db redis azurite
	./scripts/maybe-open-dev-browser.sh &
	PNPM_HOME=${PNPM_HOME:-$HOME/.local/share/pnpm} mise exec -- pnpm --filter app dev

# Test suites
audit:
	pnpm lint:dead
	pnpm lint:dupes
	just lint

lint:
	mise exec -- pnpm turbo lint

test:
	mise exec -- pnpm turbo test

watch:
	mise exec -- pnpm vitest --runInBand --watch

# Reset database to clean state
db-reset:
	docker compose -f docker-compose.dev.yml up -d db redis
	mise exec -- pnpm prisma migrate reset --force

# Health check for dev environment
doctor:
	mise exec -- pnpm dlx envinfo --system --binaries --browsers
	docker compose -f docker-compose.dev.yml ps

# Load testing shortcut
load-test:
	k6 run scripts/load-smoke.js

# AI agent friendly tmux session stub
agent-shell:
	tmux new-session -d -s klaboworld 'mise exec -- pnpm dev' \
		&& tmux split-window -v 'mise exec -- pnpm vitest --watch' \
		&& tmux split-window -h 'docker compose -f docker-compose.dev.yml logs -f' \
		&& tmux attach -t klaboworld
