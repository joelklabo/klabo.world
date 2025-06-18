.PHONY: help dev build test deploy clean

# Default target
help:
	@echo "Available commands:"
	@echo "  make dev          - Start development environment"
	@echo "  make build        - Build production version"
	@echo "  make test         - Run all tests"
	@echo "  make deploy       - Deploy to Azure"
	@echo "  make db-setup     - Initialize database"
	@echo "  make db-migrate   - Run database migrations"
	@echo "  make db-seed      - Seed database with sample data"
	@echo "  make clean        - Clean build artifacts and dependencies"
	@echo "  make logs         - View application logs"
	@echo "  make backup       - Backup database"
	@echo "  make install      - Install dependencies"
	@echo "  make container-setup - Set up Apple containers"

# Development
dev: check-deps
	@echo "Starting development environment..."
	npm run dev

dev-sqlite: check-deps
	@echo "Starting development with SQLite..."
	@if [ ! -f dev.db ]; then \
		echo "Setting up SQLite database..."; \
		npx prisma migrate dev --name init; \
		npx tsx scripts/seed.ts; \
	fi
	npm run dev

dev-container: check-deps-container container-setup
	@echo "Starting full container development environment..."
	container run --name blog-app -p 3000:3000 -v ./:/app blog:dev

# Container commands (Apple container)
container-setup:
	@echo "Setting up Apple containers..."
	@mkdir -p .container
	@echo "Pulling PostgreSQL image..."
	container pull postgres:16
	@echo "Building app container..."
	container build -t blog:dev -f Containerfile.dev .

container-postgres:
	@echo "Starting PostgreSQL container..."
	@mkdir -p .container/postgres-data
	container run -d \
		--name blog-postgres \
		-p 5432:5432 \
		-e POSTGRES_DB=blog \
		-e POSTGRES_USER=bloguser \
		-e POSTGRES_PASSWORD=localpass \
		-v .container/postgres-data:/var/lib/postgresql/data \
		postgres:16
	@echo $! > .container/postgres.pid
	@echo "Waiting for PostgreSQL to be ready..."
	@sleep 5

container-stop:
	@echo "Stopping containers..."
	@if [ -f .container/postgres.pid ]; then \
		container stop blog-postgres && rm .container/postgres.pid; \
	fi
	@container stop blog-app 2>/dev/null || true

# Database commands
db-setup: container-postgres
	@echo "Setting up database..."
	@sleep 3
	npm run db:migrate
	npm run db:seed

db-migrate:
	npm run db:migrate

db-seed:
	npm run db:seed

db-reset: db-drop db-setup

db-drop: container-stop
	@echo "Dropping database..."
	@rm -rf .container/postgres-data

# Installation
install:
	@echo "Installing dependencies..."
	npm install
	@echo "Installing additional packages..."
	npm install --save-dev @tailwindcss/typography

# Testing
test: test-unit test-e2e

test-unit:
	npm run test:unit

test-e2e:
	npm run test:e2e

test-watch:
	npm run test:watch

# Building
build: check-deps
	@echo "Building production version..."
	npm run build

build-container:
	container build -t blog:latest -f Containerfile .

# Deployment
deploy: test build
	@echo "Deploying to Azure..."
	npm run deploy:azure

deploy-preview:
	@echo "Creating preview deployment..."
	npm run deploy:preview

# Utilities
clean:
	rm -rf node_modules .next dist uploads/* .container
	npm cache clean --force

logs:
	@if [ -f .container/app.log ]; then \
		tail -f .container/app.log; \
	else \
		echo "No application logs found"; \
	fi

logs-db:
	container logs blog-postgres

backup:
	@echo "Backing up database..."
	@mkdir -p backups
	./scripts/backup.sh

restore:
	@echo "Restoring database..."
	./scripts/restore.sh $(BACKUP_FILE)

# Dependency checks
check-deps:
	@command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed."; exit 1; }

check-deps-container: check-deps
	@command -v container >/dev/null 2>&1 || { echo "Apple container is required but not installed. See: https://github.com/apple/container"; exit 1; }

# Azure specific
azure-login:
	az login

azure-resources:
	./scripts/create-azure-resources.sh

azure-config:
	./scripts/configure-azure.sh

# Quick start for first time setup
quickstart: install container-setup db-setup
	@echo "Setup complete! Run 'make dev' to start developing."