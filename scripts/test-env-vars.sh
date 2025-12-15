#!/bin/bash
# Test environment variable injection for the Next.js production container.

set -euo pipefail

echo "🔍 Testing Container Environment Variables (Next.js)"
echo "==================================================="

# Start container
echo "Starting container..."
docker-compose -f docker-compose.prod.yml up -d app-prod-test 2>/dev/null

# Wait for startup
echo "Waiting for container startup..."
sleep 5

# Check if container is running
if ! docker-compose -f docker-compose.prod.yml ps | grep -q "app-prod-test.*Up"; then
    echo "❌ Container failed to start"
    docker-compose -f docker-compose.prod.yml logs app-prod-test
    docker-compose -f docker-compose.prod.yml down
    exit 1
fi

echo ""
echo "Environment Variable Status:"
echo "---------------------------"

# Print non-secret env vars (do not print secrets)
echo -n "PORT: "
docker-compose -f docker-compose.prod.yml exec -T app-prod-test sh -c 'echo ${PORT:-"Not set"}'

echo -n "WEBSITES_PORT: "
docker-compose -f docker-compose.prod.yml exec -T app-prod-test sh -c 'echo ${WEBSITES_PORT:-"Not set"}'

echo -n "SITE_URL: "
docker-compose -f docker-compose.prod.yml exec -T app-prod-test sh -c 'echo ${SITE_URL:-"Not set"}'

echo -n "NEXTAUTH_URL: "
docker-compose -f docker-compose.prod.yml exec -T app-prod-test sh -c 'echo ${NEXTAUTH_URL:-"Not set"}'

echo -n "NEXTAUTH_SECRET: "
docker-compose -f docker-compose.prod.yml exec -T app-prod-test sh -c 'test -n "${NEXTAUTH_SECRET:-}" && echo "✅ Set" || echo "❌ Not set"'

echo -n "ADMIN_EMAIL: "
docker-compose -f docker-compose.prod.yml exec -T app-prod-test sh -c 'echo ${ADMIN_EMAIL:-"Not set"}'

echo -n "ADMIN_PASSWORD: "
docker-compose -f docker-compose.prod.yml exec -T app-prod-test sh -c 'test -n "${ADMIN_PASSWORD:-}" && echo "✅ Set" || echo "❌ Not set"'

echo -n "DATABASE_URL: "
docker-compose -f docker-compose.prod.yml exec -T app-prod-test sh -c 'echo ${DATABASE_URL:-"Not set"}'

echo -n "UPLOADS_DIR: "
docker-compose -f docker-compose.prod.yml exec -T app-prod-test sh -c 'echo ${UPLOADS_DIR:-"Not set"}'

echo -n "BUILD_VERSION: "
docker-compose -f docker-compose.prod.yml exec -T app-prod-test sh -c 'echo ${BUILD_VERSION:-"Not set"}'

echo ""
echo "Testing API Endpoints:"
echo "--------------------"

# Test home page
echo -n "Home page: "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200"; then
    echo "✅ OK"
else
    echo "❌ Failed"
fi

# Test posts page
echo -n "Posts page: "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/posts | grep -q "200"; then
    echo "✅ OK"
else
    echo "❌ Failed"
fi

# Test admin page (unauthenticated should show the login form)
echo -n "Admin page (no auth): "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/admin)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ OK (HTTP $HTTP_CODE)"
else
    echo "❌ Failed (HTTP $HTTP_CODE)"
fi

# Check for build version in /api/health
echo ""
echo "Checking build version in /api/health:"
BUILD_VERSION_CHECK=$(docker-compose -f docker-compose.prod.yml exec -T app-prod-test sh -c 'echo ${BUILD_VERSION:-""}')
HEALTH_JSON=$(curl -s http://localhost:8080/api/health)
if echo "$HEALTH_JSON" | grep -q "\"version\":\"${BUILD_VERSION_CHECK}\""; then
    echo "✅ /api/health reports version: $BUILD_VERSION_CHECK"
else
    echo "❌ /api/health did not report expected version"
    echo "$HEALTH_JSON"
fi

# Cleanup
echo ""
echo "Cleaning up..."
docker-compose -f docker-compose.prod.yml down

echo ""
echo "✅ Environment variable testing complete!"
