#!/bin/bash

# test-azure-deployment.sh
# Test the application in an Azure-like environment locally

set -e

echo "🔍 Testing Azure-like deployment locally..."
echo "==========================================="

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production not found!"
    echo "Please copy .env.production.example to .env.production and configure it."
    exit 1
fi

# Export production environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Set a test build version if not provided
export BUILD_VERSION=${BUILD_VERSION:-"test-$(date +%Y%m%d-%H%M%S)"}

echo "📦 Building production Docker image..."
echo "BUILD_VERSION: $BUILD_VERSION"

# Build and run the production container
docker-compose -f docker-compose.prod.yml build

echo ""
echo "🚀 Starting production container..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Waiting for application to start..."
sleep 10

# Test if the application is running
echo ""
echo "🧪 Running health checks..."

# Check if the server is responding
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ || echo "000")

if [ "$RESPONSE" = "200" ]; then
    echo "✅ Application is responding (HTTP $RESPONSE)"
    
    # Check if build version appears in footer
    BUILD_CHECK=$(curl -s http://localhost:8080/ | grep -o "Build: $BUILD_VERSION" || echo "")
    if [ -n "$BUILD_CHECK" ]; then
        echo "✅ Build version found in footer: $BUILD_VERSION"
    else
        echo "⚠️  Build version not found in footer"
    fi
    
    # Test static assets
    STATIC_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/css/style.css || echo "000")
    if [ "$STATIC_CHECK" = "200" ]; then
        echo "✅ Static assets serving correctly"
    else
        echo "❌ Static assets not accessible"
    fi
    
    # Test admin panel (should return 401 without auth)
    ADMIN_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/admin || echo "000")
    if [ "$ADMIN_CHECK" = "401" ]; then
        echo "✅ Admin panel is protected"
    else
        echo "⚠️  Admin panel returned unexpected status: $ADMIN_CHECK"
    fi
    
else
    echo "❌ Application is not responding (HTTP $RESPONSE)"
    echo ""
    echo "📋 Container logs:"
    docker-compose -f docker-compose.prod.yml logs --tail=50
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