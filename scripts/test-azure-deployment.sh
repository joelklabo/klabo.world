#!/bin/bash

# test-azure-deployment.sh
# Test the Next.js container in an Azure-like environment locally

set -euo pipefail

echo "🔍 Testing Azure-like deployment locally..."
echo "==========================================="

# Set a test build version if not provided
export BUILD_VERSION=${BUILD_VERSION:-"test-$(date +%Y%m%d-%H%M%S)"}

echo "📦 Pulling production container image..."
echo "BUILD_VERSION: $BUILD_VERSION"

# Pull and run the production container image
docker-compose -f docker-compose.prod.yml pull app-prod-test

echo ""
echo "🚀 Starting production container..."
docker-compose -f docker-compose.prod.yml up -d app-prod-test

echo ""
echo "⏳ Waiting for application to start..."
sleep 10

# Test if the application is running
echo ""
echo "🧪 Running health checks..."

check_endpoint() {
  local path="$1"
  local expected="${2:-200}"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080${path}" || echo "000")
  if [ "$status" = "$expected" ]; then
    echo "✅ ${path} (HTTP ${status})"
  else
    echo "❌ ${path} (HTTP ${status}, expected ${expected})"
    return 1
  fi
}

check_endpoint "/" 200
check_endpoint "/posts" 200
check_endpoint "/apps" 200
check_endpoint "/admin" 200
check_endpoint "/api/health" 200

HEALTH_JSON=$(curl -s http://localhost:8080/api/health)
if echo "$HEALTH_JSON" | grep -q "\"version\":\"${BUILD_VERSION}\""; then
  echo "✅ /api/health reports version: ${BUILD_VERSION}"
else
  echo "⚠️  /api/health did not report expected version"
  echo "$HEALTH_JSON"
fi

echo ""
echo "📊 Container status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🔗 Application URLs:"
echo "   - Homepage: http://localhost:8080"
echo "   - Blog: http://localhost:8080/posts"
echo "   - Admin: http://localhost:8080/admin"
echo ""
echo "💡 To stop the container: docker-compose -f docker-compose.prod.yml down"
echo "💡 To view logs: docker-compose -f docker-compose.prod.yml logs -f"
