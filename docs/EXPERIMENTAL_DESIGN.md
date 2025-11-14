# Local Deployment Testing Plan for klabo.world

This document provides a comprehensive plan for testing the deployment locally before pushing to Azure App Service.

## 1. Simulating the Azure Environment Locally

### A. Create Azure-like Environment Configuration

Create a `.env.production` file to simulate Azure App Service environment:

```bash
# .env.production - Azure-like environment variables
SMTP_HOST=smtp.example.com
SMTP_USERNAME=production-username
SMTP_PASSWORD=production-password
ADMIN_PASSWORD=secure-production-password
UPLOADS_DIR=/home/site/wwwroot/uploads
GA_TRACKING_ID=UA-PRODUCTION-ID
WEBSITES_PORT=8080
BUILD_VERSION=test-build-123
```

### B. Docker Compose Configuration for Production Testing

Create a `docker-compose.prod.yml` file:

```yaml
version: '3.8'

services:
  app-prod-test:
    build:
      context: .
      args:
        - BUILD_VERSION=${BUILD_VERSION:-local-test}
    environment:
      LOG_LEVEL: info
      SMTP_HOST: ${SMTP_HOST}
      SMTP_USERNAME: ${SMTP_USERNAME}
      SMTP_PASSWORD: ${SMTP_PASSWORD}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      UPLOADS_DIR: /home/site/wwwroot/uploads
      GA_TRACKING_ID: ${GA_TRACKING_ID}
      WEBSITES_PORT: 8080
      BUILD_VERSION: ${BUILD_VERSION:-local-test}
    ports:
      - '8080:8080'
    volumes:
      # Simulate Azure persistent storage
      - azure-storage:/home/site/wwwroot
    command: ["serve", "--env", "production", "--hostname", "0.0.0.0", "--port", "8080"]
    user: vapor:vapor  # Ensure non-root user like in Azure

volumes:
  azure-storage:
    driver: local
```

### C. Test Script for Azure Simulation

Create `scripts/test-azure-deployment.sh`:

```bash
#!/bin/bash
# Test script to simulate Azure deployment locally

echo "🧪 Testing Azure Deployment Locally"
echo "=================================="

# Load production-like environment
if [ -f .env.production ]; then
    export $(cat .env.production | xargs)
fi

# Build with version tag
export BUILD_VERSION="test-$(git rev-parse --short HEAD)"
echo "📦 Building with version: $BUILD_VERSION"

# Run production simulation
docker-compose -f docker-compose.prod.yml up --build
```

## 2. Testing Environment Variable Injection

### A. Environment Variable Test Checklist

1. **Create test script** `scripts/test-env-vars.sh`:
```bash
#!/bin/bash
# Test environment variable injection

echo "🔍 Testing Environment Variables"
echo "==============================="

# Start container
docker-compose -f docker-compose.prod.yml up -d app-prod-test

# Wait for startup
sleep 5

# Test each environment variable
echo "Testing SMTP configuration..."
docker-compose -f docker-compose.prod.yml exec app-prod-test sh -c 'echo $SMTP_HOST'

echo "Testing Admin Password (should be set)..."
docker-compose -f docker-compose.prod.yml exec app-prod-test sh -c 'test -n "$ADMIN_PASSWORD" && echo "✅ Set" || echo "❌ Not set"'

echo "Testing Uploads Directory..."
docker-compose -f docker-compose.prod.yml exec app-prod-test sh -c 'echo $UPLOADS_DIR'

echo "Testing Build Version..."
docker-compose -f docker-compose.prod.yml exec app-prod-test sh -c 'echo $BUILD_VERSION'

# Test API endpoints
echo "Testing admin auth..."
curl -X POST http://localhost:8080/admin/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "password=${ADMIN_PASSWORD}" \
  -v 2>&1 | grep -E "HTTP|Set-Cookie"

# Cleanup
docker-compose -f docker-compose.prod.yml down
```

### B. Configuration Verification Endpoint

Add a health check endpoint that verifies configuration (only in development):

```swift
// In routes.swift
if app.environment.isDevelopment {
    app.get("health", "config") { req async throws -> [String: String] in
        let config = req.application.storage[ConfigKey.self]!
        return [
            "smtp_configured": config.smtpHost.isEmpty ? "❌" : "✅",
            "admin_configured": config.adminPassword == "change-me-in-production" ? "❌" : "✅",
            "uploads_dir": config.uploadsDir,
            "ga_configured": config.gaTrackingID?.isEmpty == false ? "✅" : "❌",
            "build_version": Environment.get("BUILD_VERSION") ?? "unknown"
        ]
    }
}
```

## 3. Verifying Build Version in Footer

### A. Modify Footer Template

Update `Resources/Views/base.leaf` to show build version:

```html
<footer class="bg-gray-900 text-white py-8 mt-16">
    <div class="max-w-6xl mx-auto px-6 text-center">
        <p>&copy; 2025 Joel Klabo. All rights reserved.</p>
        #if(buildVersion):
        <p class="text-xs text-gray-500 mt-2">Build: #(buildVersion)</p>
        #endif
    </div>
</footer>
```

### B. Pass Build Version to Views

In `configure.swift`:

```swift
app.leaf.variables = ["buildVersion": Environment.get("BUILD_VERSION") ?? "dev"]
```

### C. Test Build Version Display

```bash
# Test with specific build version
BUILD_VERSION=test-v1.2.3 docker-compose -f docker-compose.prod.yml up

# Verify in browser
open http://localhost:8080

# Or via curl
curl -s http://localhost:8080 | grep -o "Build: [^<]*"
```

## 4. Testing Persistent Storage Locally

### A. Storage Test Script

Create `scripts/test-storage.sh`:

```bash
#!/bin/bash
# Test persistent storage behavior

echo "🗄️  Testing Persistent Storage"
echo "============================="

# Start container
docker-compose -f docker-compose.prod.yml up -d app-prod-test

# Wait for startup
sleep 5

# Create test upload directory
docker-compose -f docker-compose.prod.yml exec app-prod-test mkdir -p /home/site/wwwroot/uploads

# Upload test file via admin panel (requires manual interaction)
echo "📤 Please manually upload a test image via admin panel at http://localhost:8080/admin"
echo "Press enter when done..."
read

# List uploaded files
echo "Files in uploads directory:"
docker-compose -f docker-compose.prod.yml exec app-prod-test ls -la /home/site/wwwroot/uploads

# Stop container
docker-compose -f docker-compose.prod.yml stop

# Restart container
echo "🔄 Restarting container to test persistence..."
docker-compose -f docker-compose.prod.yml up -d app-prod-test
sleep 5

# Check if files persist
echo "Files after restart:"
docker-compose -f docker-compose.prod.yml exec app-prod-test ls -la /home/site/wwwroot/uploads

# Cleanup
docker-compose -f docker-compose.prod.yml down
```

### B. Volume Mount Verification

```bash
# Inspect volume
docker volume inspect klaboworld_azure-storage

# Check volume contents
docker run --rm -v klaboworld_azure-storage:/data alpine ls -la /data
```

## 5. Verifying Docker Image Builds Correctly

### A. Build Verification Script

Create `scripts/verify-docker-build.sh`:

```bash
#!/bin/bash
# Verify Docker build process

echo "🐳 Docker Build Verification"
echo "==========================="

# Build image with specific tag
BUILD_VERSION=$(git rev-parse --short HEAD)
docker build -t klabow-world:test-$BUILD_VERSION \
  --build-arg BUILD_VERSION=$BUILD_VERSION .

echo "✅ Build completed"

# Inspect image
echo "📊 Image details:"
docker images klabow-world:test-$BUILD_VERSION

# Test image runs correctly
echo "🏃 Testing container startup..."
docker run -d --name test-container \
  -p 8080:8080 \
  -e SMTP_HOST=test \
  -e SMTP_USERNAME=test \
  -e SMTP_PASSWORD=test \
  -e ADMIN_PASSWORD=test123 \
  -e UPLOADS_DIR=/home/site/wwwroot/uploads \
  -e BUILD_VERSION=$BUILD_VERSION \
  klabow-world:test-$BUILD_VERSION

# Wait and check health
sleep 10
if curl -f http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ Container is healthy"
else
    echo "❌ Container failed to start"
    docker logs test-container
fi

# Check running as non-root
echo "👤 Checking user context:"
docker exec test-container whoami

# Cleanup
docker stop test-container
docker rm test-container
```

### B. Multi-stage Build Verification

```bash
# Verify each build stage
docker build --target build -t klabow-world:build-stage .
docker build -t klabow-world:final .

# Compare image sizes
docker images | grep klabow-world
```

## 6. Pre-Deployment Checklist

### A. Automated Checklist Script

Create `scripts/pre-deploy-checklist.sh`:

```bash
#!/bin/bash
# Comprehensive pre-deployment checklist

echo "🚀 Pre-Deployment Checklist"
echo "=========================="
echo ""

ERRORS=0
WARNINGS=0

# 1. Environment Configuration
echo "1️⃣  Environment Configuration"
echo "----------------------------"

# Check production env file
if [ -f .env.production ]; then
    source .env.production
    
    # Validate each required variable
    [ -z "$SMTP_HOST" ] || [ "$SMTP_HOST" = "smtp.example.com" ] && echo "❌ SMTP_HOST not configured" && ((ERRORS++))
    [ -z "$ADMIN_PASSWORD" ] || [ "$ADMIN_PASSWORD" = "change-me-in-production" ] && echo "❌ ADMIN_PASSWORD not secure" && ((ERRORS++))
    [ -z "$UPLOADS_DIR" ] && echo "❌ UPLOADS_DIR not set" && ((ERRORS++))
    
    echo "✅ Environment variables validated"
else
    echo "❌ .env.production file missing"
    ((ERRORS++))
fi
echo ""

# 2. Docker Build Test
echo "2️⃣  Docker Build Test"
echo "-------------------"

if docker build -t klabow-world:test .; then
    echo "✅ Docker build successful"
    
    # Test container starts
    if docker run -d --name test-deploy \
        -e SMTP_HOST=test \
        -e SMTP_USERNAME=test \
        -e SMTP_PASSWORD=test \
        -e ADMIN_PASSWORD=test \
        -e UPLOADS_DIR=/home/site/wwwroot/uploads \
        klabow-world:test \
        && sleep 5 \
        && docker exec test-deploy curl -f http://localhost:8080 > /dev/null 2>&1; then
        echo "✅ Container starts successfully"
    else
        echo "❌ Container fails to start"
        ((ERRORS++))
    fi
    
    docker stop test-deploy 2>/dev/null && docker rm test-deploy 2>/dev/null
else
    echo "❌ Docker build failed"
    ((ERRORS++))
fi
echo ""

# 3. Test Suite
echo "3️⃣  Test Suite"
echo "------------"

if swift test; then
    echo "✅ All tests pass"
else
    echo "❌ Tests failing"
    ((ERRORS++))
fi
echo ""

# 4. Security Checks
echo "4️⃣  Security Checks"
echo "-----------------"

# Check for hardcoded secrets
if grep -r "password\|secret\|key" Sources/ --exclude-dir=.build | grep -v "adminPassword\|smtpPassword"; then
    echo "⚠️  Possible hardcoded secrets found"
    ((WARNINGS++))
else
    echo "✅ No hardcoded secrets detected"
fi

# Check file permissions in Docker image
if docker run --rm --entrypoint sh klabow-world:test -c "find /app -type f -perm /022 | wc -l" | grep -q "^0$"; then
    echo "✅ File permissions secure"
else
    echo "⚠️  Some files may have excessive permissions"
    ((WARNINGS++))
fi
echo ""

# 5. Resource Checks
echo "5️⃣  Resource Checks"
echo "-----------------"

# Check Docker image size
IMAGE_SIZE=$(docker images klabow-world:test --format "{{.Size}}")
echo "📦 Docker image size: $IMAGE_SIZE"

# Check for required directories
docker run --rm klabow-world:test ls -la /app/Resources > /dev/null 2>&1 && echo "✅ Resources directory included" || echo "❌ Resources directory missing" && ((ERRORS++))
docker run --rm klabow-world:test ls -la /app/Public > /dev/null 2>&1 && echo "✅ Public directory included" || echo "⚠️  Public directory missing" && ((WARNINGS++))
echo ""

# 6. Azure Readiness
echo "6️⃣  Azure Readiness"
echo "-----------------"

# Check GitHub secrets reminder
echo "📋 GitHub Secrets Checklist:"
echo "  [ ] AZURE_WEBAPP_PUBLISH_PROFILE configured in GitHub"
echo "  [ ] Azure Web App created and configured"
echo "  [ ] WEBSITES_PORT=8080 set in Azure Configuration"
echo "  [ ] Persistent storage mounted at /home"
echo ""

# 7. Git Status
echo "7️⃣  Git Status"
echo "------------"

if [ -d .git ]; then
    if git diff-index --quiet HEAD --; then
        echo "✅ No uncommitted changes"
    else
        echo "⚠️  Uncommitted changes found"
        ((WARNINGS++))
    fi
    
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    [ "$BRANCH" != "main" ] && echo "⚠️  Not on main branch (current: $BRANCH)" && ((WARNINGS++)) || echo "✅ On main branch"
    
    # Check for tags
    LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "none")
    echo "📌 Latest tag: $LATEST_TAG"
else
    echo "⚠️  Not a git repository"
    ((WARNINGS++))
fi
echo ""

# Summary
echo "📊 Summary"
echo "---------"
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo "❌ Deployment blocked: Fix errors before deploying"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo "⚠️  Deployment possible but review warnings"
    exit 0
else
    echo "✅ Ready for deployment!"
    echo ""
    echo "Next steps:"
    echo "1. Push to main branch: git push origin main"
    echo "2. Monitor GitHub Actions: https://github.com/YOUR_REPO/actions"
    echo "3. Verify deployment: https://klabow-world-app.azurewebsites.net"
    exit 0
fi
```

### B. Manual Verification Checklist

Create `DEPLOYMENT_CHECKLIST.md`:

```markdown
# Deployment Verification Checklist

## Pre-Deployment
- [ ] All tests pass locally (`make test`)
- [ ] Docker image builds successfully (`make docker-build`)
- [ ] Production environment variables configured in `.env.production`
- [ ] No hardcoded secrets in code
- [ ] Latest changes committed to git
- [ ] On main branch

## Local Azure Simulation
- [ ] Run `docker-compose -f docker-compose.prod.yml up`
- [ ] Verify app starts on port 8080
- [ ] Test admin login with production-like password
- [ ] Upload test image and verify persistence
- [ ] Check build version appears in footer
- [ ] Test email sending (if SMTP configured)

## Docker Image Verification
- [ ] Image runs as non-root user (vapor)
- [ ] All static resources included (Resources/, Public/)
- [ ] Image size reasonable (< 500MB)
- [ ] Container starts without errors
- [ ] Health check endpoint responds

## Azure Configuration
- [ ] Azure Web App created
- [ ] WEBSITES_PORT=8080 configured
- [ ] All environment variables set in Azure
- [ ] Persistent storage configured
- [ ] Custom domain configured (if applicable)

## GitHub Configuration
- [ ] AZURE_WEBAPP_PUBLISH_PROFILE secret set
- [ ] GitHub Actions workflow configured
- [ ] Branch protection rules set (optional)

## Post-Deployment
- [ ] Site accessible at Azure URL
- [ ] Admin panel functional
- [ ] Image uploads work and persist
- [ ] Contact form sends emails
- [ ] Build version shows in footer
- [ ] Google Analytics tracking (if configured)
- [ ] All blog posts and apps display correctly
```

## Quick Testing Commands

Add these to your Makefile:

```makefile
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
```

## Summary

This testing plan provides:

1. **Azure Environment Simulation**: Using Docker Compose with production-like settings
2. **Environment Variable Testing**: Scripts to verify all variables are properly injected
3. **Build Version Verification**: Ensuring version appears in footer
4. **Persistent Storage Testing**: Verifying uploads persist across container restarts
5. **Docker Build Verification**: Ensuring image builds correctly and runs as non-root
6. **Comprehensive Checklist**: Automated and manual checks before deployment

Run through all these tests before pushing to ensure a smooth deployment to Azure!