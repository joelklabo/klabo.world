#!/bin/bash
# Troubleshooting script for klabow.world

echo "🔍 klabow.world Troubleshooting"
echo "================================"
echo ""

# Check Swift version
echo "1. Checking Swift version..."
if command -v swift &> /dev/null; then
    SWIFT_VERSION=$(swift --version | head -1)
    echo "   ✅ $SWIFT_VERSION"
else
    echo "   ❌ Swift not installed!"
fi
echo ""

# Check .env file
echo "2. Checking .env file..."
if [ -f .env ]; then
    echo "   ✅ .env file exists"
    echo "   Variables defined:"
    grep -v '^#' .env | grep -v '^$' | cut -d= -f1 | sed 's/^/     - /'
else
    echo "   ❌ .env file missing!"
fi
echo ""

# Check required directories
echo "3. Checking required directories..."
DIRS=("Public" "Public/uploads" "Resources/Posts" "Resources/Views")
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "   ✅ $dir exists"
    else
        echo "   ❌ $dir missing!"
    fi
done
echo ""

# Check for posts
echo "4. Checking blog posts..."
POST_COUNT=$(find Resources/Posts -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
if [ "$POST_COUNT" -gt 0 ]; then
    echo "   ✅ Found $POST_COUNT blog post(s)"
    find Resources/Posts -name "*.md" -exec basename {} \; | sed 's/^/     - /'
else
    echo "   ⚠️  No blog posts found"
fi
echo ""

# Check if port is available
echo "5. Checking port 8080..."
if lsof -i :8080 &> /dev/null; then
    echo "   ❌ Port 8080 is already in use!"
    echo "   Process using port:"
    lsof -i :8080 | grep LISTEN | head -1
else
    echo "   ✅ Port 8080 is available"
fi
echo ""

# Test build
echo "6. Testing build..."
if swift build &> /dev/null; then
    echo "   ✅ Build successful"
else
    echo "   ❌ Build failed! Run 'swift build' to see errors"
fi
echo ""

# Check localhost resolution
echo "7. Checking localhost resolution..."
if ping -c 1 localhost &> /dev/null; then
    echo "   ✅ localhost resolves correctly"
else
    echo "   ❌ localhost resolution issue!"
fi
echo ""

# Summary
echo "Summary"
echo "-------"
if [ -f .env ] && [ "$POST_COUNT" -gt 0 ] && ! lsof -i :8080 &> /dev/null; then
    echo "✅ Everything looks good! Try running: make run"
else
    echo "⚠️  Some issues detected. Please fix them before running the server."
fi
echo ""

# Additional help
echo "Common fixes:"
echo "• Missing .env:     Run 'make setup'"
echo "• Port in use:      Kill the process or use a different port"
echo "• Build errors:     Check 'swift build' output"
echo "• No posts:         Create a post with 'make new-post title=\"My Post\"'"