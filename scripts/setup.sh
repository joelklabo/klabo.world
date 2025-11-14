#!/bin/bash
# Initial setup script for klabow.world

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SWIFT_CMD="$REPO_ROOT/scripts/swift-tmp.sh"

echo "🚀 Setting up klabow.world..."
echo ""

# Check Swift version
echo "Checking Swift version..."
if ! command -v swift &> /dev/null; then
    echo "❌ Swift is not installed. Please install Swift 6.0+"
    echo "Visit: https://swift.org/download/"
    exit 1
fi

SWIFT_VERSION=$(swift --version | head -1)
echo "✅ $SWIFT_VERSION"
echo ""

# Check for Vapor toolbox
echo "Checking for Vapor toolbox..."
if ! command -v vapor &> /dev/null; then
    echo "⚠️  Vapor toolbox not installed"
    echo "Installing with Homebrew..."
    if command -v brew &> /dev/null; then
        brew install vapor
    else
        echo "❌ Homebrew not found. Please install Vapor toolbox manually:"
        echo "brew install vapor"
    fi
else
    echo "✅ Vapor toolbox installed"
fi
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
SMTP_HOST=smtp.example.com
SMTP_USERNAME=username
SMTP_PASSWORD=password
ADMIN_PASSWORD=change-me-in-production
UPLOADS_DIR=./Public/uploads
# GA_TRACKING_ID=UA-XXXXXXXXX-X
EOF
    echo "✅ Created .env file"
    echo "⚠️  Please update .env with your actual values"
else
    echo "✅ .env file already exists"
fi
echo ""

# Create necessary directories
echo "Creating directories..."
mkdir -p Public/uploads
mkdir -p Resources/Posts
echo "✅ Directories created"
echo ""

# Install dependencies
echo "Installing Swift dependencies..."
"$SWIFT_CMD" package resolve
echo "✅ Dependencies installed"
echo ""

# Optional tools
echo "Optional tools:"
echo ""

if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker not installed (optional, but recommended)"
    echo "   Install from: https://docker.com"
else
    echo "✅ Docker installed"
fi

if ! command -v swift-format &> /dev/null; then
    echo "⚠️  swift-format not installed (optional)"
    echo "   Install with: brew install swift-format"
else
    echo "✅ swift-format installed"
fi

if ! command -v swiftlint &> /dev/null; then
    echo "⚠️  SwiftLint not installed (optional)"
    echo "   Install with: brew install swiftlint"
else
    echo "✅ SwiftLint installed"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your configuration"
echo "2. Run 'make run' to start the development server"
echo "3. Visit http://localhost:8080"
echo ""
echo "For more commands, run: make help"
