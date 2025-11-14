#!/bin/bash

# Test Upload Functionality Script
# Simulates Azure App Service environment for upload testing

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SWIFT_CMD="$SCRIPT_DIR/scripts/swift-tmp.sh"

echo "🚀 Starting Upload Functionality Testing"
echo "======================================="

# Create uploads directory to simulate Azure persistent storage
UPLOADS_DIR="/tmp/klabo-world-uploads"
mkdir -p "$UPLOADS_DIR"
echo "✅ Created uploads directory: $UPLOADS_DIR"

# Set production-like environment variables
export LOG_LEVEL=info
export SMTP_HOST=smtp.example.com
export SMTP_USERNAME=username
export SMTP_PASSWORD=password
export ADMIN_PASSWORD='$2b$12$0GE..B38fX1dfqVXpfhFh.mnsTz2Y0vgFxj4miK/ICqUUo7XjWocG'
export UPLOADS_DIR="$UPLOADS_DIR"
export WEBSITES_PORT=8080

echo "✅ Environment variables set:"
echo "   UPLOADS_DIR=$UPLOADS_DIR"
echo "   LOG_LEVEL=$LOG_LEVEL"
echo "   WEBSITES_PORT=$WEBSITES_PORT"

# Build the project
echo ""
echo "🔨 Building project..."
"$SWIFT_CMD" build --configuration release

# Run in background
echo ""
echo "🌐 Starting server in production mode..."
"$SWIFT_CMD" run --configuration release KlaboWorld serve --env production --hostname 0.0.0.0 --port 8080 &
SERVER_PID=$!

echo "✅ Server started with PID: $SERVER_PID"
echo "   Waiting for server to be ready..."

# Wait for server to start
sleep 5

# Check if server is responding
if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ Server is responding"
else
    echo "❌ Server is not responding"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "🎯 Server ready for testing!"
echo "   URL: http://localhost:8080"
echo "   Admin: http://localhost:8080/admin"
echo "   Upload endpoint: http://localhost:8080/admin/upload"
echo ""
echo "To stop the server, run: kill $SERVER_PID"
echo "Server PID saved to: /tmp/klabo-server.pid"

echo $SERVER_PID > /tmp/klabo-server.pid

# Keep script running to monitor
wait $SERVER_PID
