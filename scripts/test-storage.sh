#!/bin/bash
# Test persistent storage behavior for the Azure-like Docker volumes.

set -euo pipefail

echo "🗄️  Testing Persistent Storage"
echo "============================="

# Start container
echo "Starting container..."
docker-compose -f docker-compose.prod.yml up -d app-prod-test

# Wait for startup
echo "Waiting for startup..."
sleep 5

# Create test upload directory
echo "Creating uploads directory..."
docker-compose -f docker-compose.prod.yml exec -T app-prod-test sh -c "mkdir -p /home/site/wwwroot/uploads && echo '✅ Directory created'"

# Create a test file
TEST_FILE="test-$(date +%s).txt"
echo "Creating test file: $TEST_FILE"
docker-compose -f docker-compose.prod.yml exec -T app-prod-test sh -c "echo 'Test content for persistence' > /home/site/wwwroot/uploads/$TEST_FILE"

# List files
echo ""
echo "Files in uploads directory:"
docker-compose -f docker-compose.prod.yml exec -T app-prod-test ls -la /home/site/wwwroot/uploads

# Get file content
ORIGINAL_CONTENT=$(docker-compose -f docker-compose.prod.yml exec -T app-prod-test cat /home/site/wwwroot/uploads/$TEST_FILE)
echo "Original content: $ORIGINAL_CONTENT"

# Stop container
echo ""
echo "🔄 Stopping container..."
docker-compose -f docker-compose.prod.yml stop

# Restart container
echo "🔄 Restarting container to test persistence..."
docker-compose -f docker-compose.prod.yml up -d app-prod-test
sleep 5

# Check if files persist
echo ""
echo "Files after restart:"
docker-compose -f docker-compose.prod.yml exec -T app-prod-test ls -la /home/site/wwwroot/uploads

# Check file content
if docker-compose -f docker-compose.prod.yml exec -T app-prod-test test -f /home/site/wwwroot/uploads/$TEST_FILE; then
    PERSISTED_CONTENT=$(docker-compose -f docker-compose.prod.yml exec -T app-prod-test cat /home/site/wwwroot/uploads/$TEST_FILE)
    if [ "$ORIGINAL_CONTENT" = "$PERSISTED_CONTENT" ]; then
        echo "✅ File persisted correctly with content: $PERSISTED_CONTENT"
    else
        echo "❌ File content changed!"
    fi
else
    echo "❌ File did not persist after restart!"
fi

# Test upload directory permissions
echo ""
echo "Directory permissions:"
docker-compose -f docker-compose.prod.yml exec -T app-prod-test ls -ld /home/site/wwwroot/uploads

# Test writing inside the container
echo ""
echo "Testing write permissions inside container:"
docker-compose -f docker-compose.prod.yml exec -T app-prod-test sh -c "whoami && touch /home/site/wwwroot/uploads/container-write-test.txt && echo '✅ Can write to uploads dir'"

# Cleanup
echo ""
echo "Cleaning up..."
docker-compose -f docker-compose.prod.yml down

echo ""
echo "✅ Persistent storage testing complete!"
