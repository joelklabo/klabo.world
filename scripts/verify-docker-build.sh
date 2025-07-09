#!/bin/bash
# Verify Docker build process

echo "🐳 Docker Build Verification"
echo "==========================="

# Clean up any existing test containers
docker stop test-container 2>/dev/null && docker rm test-container 2>/dev/null

# Build image with specific tag
BUILD_VERSION=$(git rev-parse --short HEAD 2>/dev/null || echo 'local-test')
IMAGE_TAG="klabow-world:test-$BUILD_VERSION"

echo "Building image: $IMAGE_TAG"
echo "Build version: $BUILD_VERSION"
echo ""

# Build image
if docker build -t "$IMAGE_TAG" \
  --build-arg BUILD_VERSION=$BUILD_VERSION .; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build failed"
    exit 1
fi

# Inspect image
echo ""
echo "📊 Image details:"
docker images "$IMAGE_TAG"

# Get image size
IMAGE_SIZE=$(docker images "$IMAGE_TAG" --format "{{.Size}}")
echo "Image size: $IMAGE_SIZE"

# Check if size is reasonable (under 500MB)
SIZE_MB=$(docker images "$IMAGE_TAG" --format "{{.Size}}" | sed 's/MB//' | sed 's/GB/*1024/' | bc 2>/dev/null || echo "0")
if [ -n "$SIZE_MB" ] && [ "$SIZE_MB" -lt 500 ] 2>/dev/null; then
    echo "✅ Image size is reasonable"
else
    echo "⚠️  Image might be large: $IMAGE_SIZE"
fi

# Test image runs correctly
echo ""
echo "🏃 Testing container startup..."
docker run -d --name test-container \
  -p 8080:8080 \
  -e SMTP_HOST=test \
  -e SMTP_USERNAME=test \
  -e SMTP_PASSWORD=test \
  -e ADMIN_PASSWORD=test123 \
  -e UPLOADS_DIR=/home/site/wwwroot/uploads \
  -e BUILD_VERSION=$BUILD_VERSION \
  "$IMAGE_TAG"

# Wait for startup
echo "Waiting for container to start..."
sleep 10

# Check if container is running
if docker ps | grep -q test-container; then
    echo "✅ Container is running"
else
    echo "❌ Container failed to start"
    echo "Container logs:"
    docker logs test-container
    docker rm test-container
    exit 1
fi

# Check health
echo ""
echo "🏥 Health check:"
if curl -f -s http://localhost:8080 > /dev/null; then
    echo "✅ Application is responding"
    
    # Check for build version in response
    if curl -s http://localhost:8080 | grep -q "Build:.*$BUILD_VERSION"; then
        echo "✅ Build version appears in output"
    else
        echo "⚠️  Build version not found in output"
    fi
else
    echo "❌ Application not responding"
    echo "Container logs:"
    docker logs test-container
fi

# Check running as non-root
echo ""
echo "👤 Security checks:"
USER=$(docker exec test-container whoami)
if [ "$USER" = "vapor" ]; then
    echo "✅ Running as non-root user: $USER"
else
    echo "❌ Not running as expected user. Current user: $USER"
fi

# Check file permissions
echo ""
echo "🔒 File permissions:"
WRITABLE_COUNT=$(docker exec test-container find /app -type f -perm /022 2>/dev/null | wc -l)
if [ "$WRITABLE_COUNT" -eq 0 ]; then
    echo "✅ No world-writable files found"
else
    echo "⚠️  Found $WRITABLE_COUNT world-writable files"
fi

# Check required directories
echo ""
echo "📁 Directory structure:"
docker exec test-container ls -la /app/Resources > /dev/null 2>&1 && echo "✅ Resources directory exists" || echo "❌ Resources directory missing"
docker exec test-container ls -la /app/Public > /dev/null 2>&1 && echo "✅ Public directory exists" || echo "❌ Public directory missing"

# Check binary
echo ""
echo "🔧 Binary information:"
docker exec test-container ls -la /app/KlaboWorld

# Multi-stage build verification
echo ""
echo "🏗️  Build stages verification:"
echo "Testing build stage..."
if docker build --target build -t "$IMAGE_TAG-build" . > /dev/null 2>&1; then
    BUILD_SIZE=$(docker images "$IMAGE_TAG-build" --format "{{.Size}}")
    FINAL_SIZE=$(docker images "$IMAGE_TAG" --format "{{.Size}}")
    echo "✅ Multi-stage build working"
    echo "   Build stage size: $BUILD_SIZE"
    echo "   Final stage size: $FINAL_SIZE"
    
    # Clean up build stage image
    docker rmi "$IMAGE_TAG-build" > /dev/null 2>&1
else
    echo "⚠️  Could not verify multi-stage build"
fi

# Cleanup
echo ""
echo "🧹 Cleaning up..."
docker stop test-container
docker rm test-container

echo ""
echo "✅ Docker build verification complete!"

# Summary
echo ""
echo "📋 Summary:"
echo "- Image tag: $IMAGE_TAG"
echo "- Image size: $IMAGE_SIZE"
echo "- Build version: $BUILD_VERSION"
echo "- User context: $USER"
echo ""
echo "To test the image manually:"
echo "  docker run -it --rm -p 8080:8080 \\"
echo "    -e ADMIN_PASSWORD=test \\"
echo "    -e SMTP_HOST=test \\"
echo "    -e SMTP_USERNAME=test \\"
echo "    -e SMTP_PASSWORD=test \\"
echo "    $IMAGE_TAG"