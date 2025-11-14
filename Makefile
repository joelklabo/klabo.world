# Makefile for klabow.world
# Provides convenient shortcuts for common development tasks

SWIFT := ./scripts/swift-tmp.sh
SWIFT_SCRATCH_PATH := $(shell ./scripts/swift-scratch-path.sh)

.PHONY: help
help: ## Show this help message
	@echo "klabow.world Development Commands"
	@echo "================================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development Commands
.PHONY: setup
setup: ## Initial project setup
	@echo "Setting up klabow.world..."
	@if [ ! -f .env ]; then \
		cp .env.example .env 2>/dev/null || echo "Creating .env file..."; \
		echo "SMTP_HOST=smtp.example.com" > .env; \
		echo "SMTP_USERNAME=username" >> .env; \
		echo "SMTP_PASSWORD=password" >> .env; \
		echo "ADMIN_PASSWORD=change-me-in-production" >> .env; \
		echo "UPLOADS_DIR=./Public/uploads" >> .env; \
		echo "# GA_TRACKING_ID=UA-XXXXXXXXX-X" >> .env; \
		echo "✅ Created .env file - please update with your values"; \
	else \
		echo "✅ .env file already exists"; \
	fi
	@$(SWIFT) package resolve
	@echo "✅ Setup complete!"

.PHONY: run
run: ## Run development server
	@pkill -f "swift run" 2>/dev/null || true
	@lsof -ti:8080 | xargs kill -9 2>/dev/null || true
	@sleep 1
	./scripts/run-server.sh

.PHONY: dev
dev: ## Run development server with auto-reload
	@echo "🔄 Starting server with auto-reload (if available)..."
	@$(SWIFT) run --enable-hot-reload 2>/dev/null || ./scripts/run-server.sh

.PHONY: build
build: ## Build the project
	npx tailwindcss -i ./tailwind.input.css -o ./Public/css/app.css --minify
	$(SWIFT) build

.PHONY: clean
clean: ## Clean build artifacts
	$(SWIFT) package clean
	rm -rf .build "$(SWIFT_SCRATCH_PATH)"

.PHONY: test
test: ## Run all tests
	$(SWIFT) test

.PHONY: test-verbose
test-verbose: ## Run tests with verbose output
	$(SWIFT) test --verbose

.PHONY: test-coverage
test-coverage: ## Run tests with coverage
	$(SWIFT) test --enable-code-coverage
	@echo "Coverage report available in .build/debug/codecov/"

.PHONY: test-watch
test-watch: ## Run tests in watch mode
	@echo "Running tests in watch mode..."
	@while true; do \
		$(SWIFT) test; \
		echo "Waiting for changes..."; \
		fswatch -o Sources Tests | read; \
	done

.PHONY: format
format: ## Format code
	@if command -v swift-format &> /dev/null; then \
		swift-format -i -r Sources/ Tests/; \
		echo "✅ Code formatted"; \
	else \
		echo "❌ swift-format not installed. Install with: brew install swift-format"; \
	fi

.PHONY: lint
lint: ## Lint code
	@if command -v swiftlint &> /dev/null; then \
		swiftlint; \
	else \
		echo "❌ SwiftLint not installed. Install with: brew install swiftlint"; \
	fi

# Docker Commands
.PHONY: docker-build
docker-build: ## Build Docker image
	docker-compose build

.PHONY: docker-dev
docker-dev: ## Run with Docker in development mode
	docker-compose up app-dev

.PHONY: docker-prod
docker-prod: ## Run with Docker in production mode
	docker-compose up app

.PHONY: docker-down
docker-down: ## Stop all Docker containers
	docker-compose down

.PHONY: docker-logs
docker-logs: ## View Docker logs
	docker-compose logs -f

.PHONY: docker-shell
docker-shell: ## Open shell in Docker container
	docker-compose exec app-dev /bin/bash

.PHONY: docker-clean
docker-clean: ## Clean Docker volumes and images
	docker-compose down -v
	docker image prune -f

# Content Management
.PHONY: new-post
new-post: ## Create a new blog post (usage: make new-post title="My Title")
	@if [ -z "$(title)" ]; then \
		echo "Error: Please provide a title. Usage: make new-post title=\"My Title\""; \
		exit 1; \
	fi
	@./scripts/new-post.sh "$(title)"

.PHONY: list-posts
list-posts: ## List all blog posts
	@echo "Blog Posts:"
	@echo "==========="
	@ls -1 Resources/Posts/*.md 2>/dev/null | sed 's/Resources\/Posts\///' | sed 's/\.md//' || echo "No posts found"

# Deployment Commands
.PHONY: pre-commit
pre-commit: lint test ## Run checks before committing
	@echo "✅ All checks passed!"

.PHONY: preview
preview: build ## Build and run for preview
	$(SWIFT) run --configuration release

.PHONY: docker-push
docker-push: ## Build and push Docker image
	@echo "Building and pushing Docker image..."
	@if [ -z "$(DOCKER_REGISTRY)" ]; then \
		echo "Error: DOCKER_REGISTRY not set"; \
		exit 1; \
	fi
	docker-compose build app
	docker tag klabo-world:latest $(DOCKER_REGISTRY)/klabo-world:latest
	docker tag klabo-world:latest $(DOCKER_REGISTRY)/klabo-world:$(shell git rev-parse --short HEAD)
	docker push $(DOCKER_REGISTRY)/klabo-world:latest
	docker push $(DOCKER_REGISTRY)/klabo-world:$(shell git rev-parse --short HEAD)

.PHONY: deploy-check
deploy-check: ## Check deployment readiness
	@./scripts/deploy-check.sh

.PHONY: logs
logs: ## View application logs (Docker or local)
	@if docker-compose ps | grep -q "app"; then \
		docker-compose logs -f app app-dev; \
	else \
		echo "No Docker containers running. For local logs, check console output."; \
	fi

# Database Commands (for future use)
.PHONY: db-reset
db-reset: ## Reset database (when implemented)
	@echo "Database operations not yet implemented"

# Utility Commands
.PHONY: ports
ports: ## Show ports in use
	@echo "Checking port 8080..."
	@lsof -i :8080 || echo "Port 8080 is free"

.PHONY: env-check
env-check: ## Verify environment setup
	@./scripts/troubleshoot.sh

.PHONY: troubleshoot
troubleshoot: env-check ## Run troubleshooting diagnostics

.PHONY: deps
deps: ## Install dependencies
	$(SWIFT) package resolve
	@echo "✅ Dependencies installed"

.PHONY: update
update: ## Update dependencies
	$(SWIFT) package update
	@echo "✅ Dependencies updated"

# Server Commands
.PHONY: start
start: run ## Alias for 'run'

.PHONY: stop
stop: ## Stop any running servers
	@pkill -f "swift run" 2>/dev/null || echo "No Swift servers running"
	@lsof -ti:8080 | xargs kill -9 2>/dev/null || true
	@docker-compose down 2>/dev/null || echo "No Docker containers to stop"

.PHONY: restart
restart: stop start ## Restart server

# Testing Commands for Deployment
.PHONY: test-azure-local
test-azure-local: ## Test Azure-like deployment locally
	@./scripts/test-azure-deployment.sh

.PHONY: test-env
test-env: ## Test environment variable injection
	@./scripts/test-env-vars.sh

.PHONY: test-storage
test-storage: ## Test persistent storage
	@./scripts/test-storage.sh

.PHONY: verify-build
verify-build: ## Verify Docker build
	@./scripts/verify-docker-build.sh

.PHONY: deploy-checklist
deploy-checklist: ## Run pre-deployment checklist
	@./scripts/pre-deploy-checklist.sh

.PHONY: prod-env
prod-env: ## Create production environment file from example
	@if [ ! -f .env.production ]; then \
		cp .env.production.example .env.production; \
		echo "✅ Created .env.production - please update with real values"; \
	else \
		echo "⚠️  .env.production already exists"; \
	fi

# Default target
.DEFAULT_GOAL := help
