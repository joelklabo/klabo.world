#!/bin/bash
# Server startup script with better user feedback

echo "🚀 Starting klabow.world server..."
echo ""

# Kill any existing server process on port 8080
if lsof -i :8080 &>/dev/null; then
    echo "⚠️  Found existing process on port 8080, stopping it..."
    lsof -i :8080 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null
    sleep 1
    echo "✅ Previous server stopped"
    echo ""
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Run 'make setup' first to create it."
    exit 1
fi

# Build and run
echo "Building project..."
swift build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "Starting server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Server will be available at:"
echo "   • http://localhost:8080"
echo "   • http://127.0.0.1:8080"
echo ""
echo "📍 Available routes:"
echo "   • Homepage:      http://localhost:8080/"
echo "   • Blog:          http://localhost:8080/posts"
echo "   • Contact:       http://localhost:8080/contact"
echo "   • Admin:         http://localhost:8080/admin (auth required)"
echo ""
echo "🔐 Admin credentials:"
echo "   • Username: admin"
echo "   • Password: (check your .env file)"
echo ""
echo "Press Ctrl+C to stop the server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Run the server
exec swift run