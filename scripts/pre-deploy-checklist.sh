#!/bin/bash

# pre-deploy-checklist.sh
# Automated checklist to run before deploying to Azure

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SWIFT_CMD="$REPO_ROOT/scripts/swift-tmp.sh"

echo "🚀 Pre-Deployment Checklist"
echo "=========================="
echo ""

ERRORS=0
WARNINGS=0

# Function to check condition
check() {
    local condition=$1
    local success_msg=$2
    local error_msg=$3
    local is_warning=${4:-false}
    
    if eval "$condition"; then
        echo "✅ $success_msg"
    else
        if [ "$is_warning" = true ]; then
            echo "⚠️  $error_msg"
            ((WARNINGS++))
        else
            echo "❌ $error_msg"
            ((ERRORS++))
        fi
    fi
}

# 1. Check if .env.production exists
check "[ -f .env.production ]" \
    ".env.production file exists" \
    ".env.production file not found - copy from .env.production.example"

# 2. Check for hardcoded secrets
echo ""
echo "🔍 Checking for hardcoded secrets..."
SECRETS_FOUND=$(grep -r "password\|secret\|key" Sources/ --include="*.swift" | grep -v "adminPassword\|smtpPassword\|ConfigKey" | grep -E "=\s*\"" || true)
if [ -z "$SECRETS_FOUND" ]; then
    echo "✅ No hardcoded secrets found"
else
    echo "⚠️  Potential hardcoded secrets found:"
    echo "$SECRETS_FOUND"
    ((WARNINGS++))
fi

# 3. Check Docker build
echo ""
echo "🐳 Testing Docker build..."
if docker build -t klabo-test --build-arg BUILD_VERSION=test . > /dev/null 2>&1; then
    echo "✅ Docker build successful"
    docker rmi klabo-test > /dev/null 2>&1
else
    echo "❌ Docker build failed"
    ((ERRORS++))
fi

# 4. Check for Azure publish profile secret
echo ""
echo "🔑 Checking GitHub secrets..."
if [ -n "$GITHUB_TOKEN" ]; then
    # This would require GitHub CLI and permissions
    echo "⚠️  Cannot verify GitHub secrets without proper authentication"
    echo "   Please ensure AZURE_WEBAPP_PUBLISH_PROFILE is set in repository secrets"
    ((WARNINGS++))
else
    echo "⚠️  Skipping GitHub secrets check (no GITHUB_TOKEN)"
    ((WARNINGS++))
fi

# 5. Check if tests pass
echo ""
echo "🧪 Running tests..."
if "$SWIFT_CMD" test > /dev/null 2>&1; then
    echo "✅ All tests passed"
else
    echo "❌ Tests failed"
    ((ERRORS++))
fi

# 6. Check for uncommitted changes
echo ""
echo "📝 Checking Git status..."
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ No uncommitted changes"
else
    echo "⚠️  Uncommitted changes found:"
    git status --short
    ((WARNINGS++))
fi

# 7. Check current branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo "✅ On main branch"
else
    echo "⚠️  Not on main branch (current: $CURRENT_BRANCH)"
    ((WARNINGS++))
fi

# 8. Check if main branch is up to date
git fetch origin main > /dev/null 2>&1
LOCAL=$(git rev-parse main)
REMOTE=$(git rev-parse origin/main)
if [ "$LOCAL" = "$REMOTE" ]; then
    echo "✅ Main branch is up to date"
else
    echo "⚠️  Main branch is not up to date with origin"
    ((WARNINGS++))
fi

# 9. Validate environment variables in .env.production
if [ -f .env.production ]; then
    echo ""
    echo "🔧 Validating .env.production..."
    
    # Check for required variables
    for var in SMTP_HOST SMTP_USERNAME SMTP_PASSWORD ADMIN_PASSWORD; do
        if grep -q "^$var=" .env.production && ! grep -q "^$var=\s*$" .env.production; then
            echo "✅ $var is set"
        else
            echo "❌ $var is not set or empty"
            ((ERRORS++))
        fi
    done
fi

# 10. Check file permissions
echo ""
echo "🔒 Checking file permissions..."
EXECUTABLE_SWIFTS=$(find Sources/ -name "*.swift" -perm +111 2>/dev/null || true)
if [ -z "$EXECUTABLE_SWIFTS" ]; then
    echo "✅ No Swift files with execute permissions"
else
    echo "⚠️  Swift files with execute permissions found:"
    echo "$EXECUTABLE_SWIFTS"
    ((WARNINGS++))
fi

# Summary
echo ""
echo "======================================="
echo "📊 Summary:"
echo "   Errors: $ERRORS"
echo "   Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo "✅ All checks passed! Ready to deploy."
        exit 0
    else
        echo "⚠️  Deployment possible but review warnings first."
        exit 0
    fi
else
    echo "❌ Deployment blocked! Fix errors before proceeding."
    exit 1
fi
