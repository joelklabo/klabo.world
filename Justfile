set shell := ["/bin/bash", "-c"]

# Helper to ensure corepack + pnpm versions match .tool-versions
bootstrap:
	mise install
	corepack enable
	corepack prepare pnpm@10.22.0 --activate
	npm config set fund false
	pnpm install --ignore-scripts

# Start local services + dev server
alias dev := run-dev
run-dev:
	docker compose -f docker-compose.dev.yml up -d db redis azurite
	./scripts/maybe-open-dev-browser.sh &
	PNPM_HOME=${PNPM_HOME:-$HOME/.local/share/pnpm} pnpm --filter app dev

# Test suites
lint:
	pnpm turbo lint

test:
	pnpm turbo test

watch:
	pnpm vitest --runInBand --watch

# Reset database to clean state
db-reset:
	docker compose -f docker-compose.dev.yml up -d db redis
	pnpm prisma migrate reset --force

# Health check for dev environment
doctor:
	pnpm dlx envinfo --system --binaries --browsers
	docker compose -f docker-compose.dev.yml ps

# Load testing shortcut
load-test:
	k6 run scripts/load-smoke.js

# AI agent friendly tmux session stub
agent-shell:
	tmux new-session -d -s klaboworld 'pnpm dev' \
		&& tmux split-window -v 'pnpm vitest --watch' \
		&& tmux split-window -h 'docker compose -f docker-compose.dev.yml logs -f' \
		&& tmux attach -t klaboworld
