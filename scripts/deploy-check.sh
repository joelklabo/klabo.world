#!/bin/bash
# Pre-deployment checklist

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SWIFT_CMD="$REPO_ROOT/scripts/swift-tmp.sh"

echo "🚀 Deployment Readiness Check"
echo "============================"
echo ""

ERRORS=0
WARNINGS=0

# Check if .env exists
echo "Checking environment..."
if [ ! -f .env ]; then
    echo "❌ .env file missing"
    ((ERRORS++))
else
    echo "✅ .env file exists"
    
    # Check required env vars
    source .env
    if [ -z "$SMTP_HOST" ] || [ "$SMTP_HOST" = "smtp.example.com" ]; then
        echo "⚠️  SMTP_HOST not configured"
        ((WARNINGS++))
    fi
    
    if [ -z "$ADMIN_PASSWORD" ] || [ "$ADMIN_PASSWORD" = "change-me-in-production" ]; then
        echo "❌ ADMIN_PASSWORD not changed from default"
        ((ERRORS++))
    fi
fi
echo ""

# Check if tests pass
echo "Running tests..."
if "$SWIFT_CMD" test > /dev/null 2>&1; then
    echo "✅ All tests pass"
else
    echo "❌ Tests failing"
    ((ERRORS++))
fi
echo ""

# Check Docker
echo "Checking Docker..."
if command -v docker &> /dev/null; then
    echo "✅ Docker installed"
    
    # Try to build Docker image
    echo "Testing Docker build..."
    if docker-compose build app > /dev/null 2>&1; then
        echo "✅ Docker image builds successfully"
    else
        echo "❌ Docker build failed"
        ((ERRORS++))
    fi
else
    echo "⚠️  Docker not installed"
    ((WARNINGS++))
fi
echo ""

# Check for uncommitted changes
echo "Checking git status..."
if [ -d .git ]; then
    if git diff-index --quiet HEAD --; then
        echo "✅ No uncommitted changes"
    else
        echo "⚠️  Uncommitted changes found"
        ((WARNINGS++))
    fi
    
    # Check branch
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$BRANCH" != "main" ]; then
        echo "⚠️  Not on main branch (current: $BRANCH)"
        ((WARNINGS++))
    else
        echo "✅ On main branch"
    fi
else
    echo "⚠️  Not a git repository"
    ((WARNINGS++))
fi
echo ""

# Check Azure CLI
echo "Checking Azure CLI..."
if command -v az &> /dev/null; then
    echo "✅ Azure CLI installed"
    
    # Check if logged in
    if az account show > /dev/null 2>&1; then
        echo "✅ Logged into Azure"
    else
        echo "⚠️  Not logged into Azure (run: az login)"
        ((WARNINGS++))
    fi
else
    echo "⚠️  Azure CLI not installed"
    echo "   Install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    ((WARNINGS++))
fi
echo ""

# Check GitHub secrets reminder
echo "GitHub Secrets Checklist:"
echo "------------------------"
echo "Ensure these are set in your GitHub repository:"
echo "  [ ] AZURE_WEBAPP_PUBLISH_PROFILE"
echo "  [ ] Any other deployment secrets"
echo ""

# Summary
echo "Summary"
echo "-------"
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo "❌ Deployment blocked: Please fix errors before deploying"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo "⚠️  Deployment possible but warnings should be addressed"
    exit 0
else
    echo "✅ Ready for deployment!"
    exit 0
fi
