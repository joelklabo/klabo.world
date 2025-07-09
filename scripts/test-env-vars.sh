#!/bin/bash
# Test environment variable injection

echo "🔍 Testing Environment Variables"
echo "==============================="

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

# Test each environment variable
echo -n "SMTP_HOST: "
docker-compose -f docker-compose.prod.yml exec -T app-prod-test sh -c 'echo $SMTP_HOST'

echo -n "SMTP_USERNAME: "
docker-compose -f docker-compose.prod.yml exec -T app-prod-test sh -c 'echo $SMTP_USERNAME'

echo -n "Admin Password: "
docker-compose -f docker-compose.prod.yml exec -T app-prod-test sh -c 'test -n "$ADMIN_PASSWORD" && echo "✅ Set" || echo "❌ Not set"'

echo -n "Uploads Directory: "
docker-compose -f docker-compose.prod.yml exec -T app-prod-test sh -c 'echo $UPLOADS_DIR'

echo -n "GA Tracking ID: "
docker-compose -f docker-compose.prod.yml exec -T app-prod-test sh -c 'echo ${GA_TRACKING_ID:-"Not set"}'

echo -n "Build Version: "
docker-compose -f docker-compose.prod.yml exec -T app-prod-test sh -c 'echo ${BUILD_VERSION:-"Not set"}'

echo -n "Websites Port: "
docker-compose -f docker-compose.prod.yml exec -T app-prod-test sh -c 'echo ${WEBSITES_PORT:-"Not set"}'

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

# Test admin page (should require auth)
echo -n "Admin page (no auth): "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/admin)
if [ "$HTTP_CODE" = "303" ] || [ "$HTTP_CODE" = "401" ]; then
    echo "✅ Protected (HTTP $HTTP_CODE)"
else
    echo "❌ Not protected (HTTP $HTTP_CODE)"
fi

# Test posts page
echo -n "Posts page: "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/posts | grep -q "200"; then
    echo "✅ OK"
else
    echo "❌ Failed"
fi

# Check for build version in footer
echo ""
echo "Checking build version in footer:"
BUILD_VERSION_CHECK=$(docker-compose -f docker-compose.prod.yml exec -T app-prod-test sh -c 'echo $BUILD_VERSION')
if curl -s http://localhost:8080 | grep -q "Build:.*${BUILD_VERSION_CHECK}"; then
    echo "✅ Build version appears in footer: $BUILD_VERSION_CHECK"
else
    echo "❌ Build version not found in footer"
fi

# Cleanup
echo ""
echo "Cleaning up..."
docker-compose -f docker-compose.prod.yml down

echo ""
echo "✅ Environment variable testing complete!"