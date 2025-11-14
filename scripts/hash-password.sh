#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SWIFT_CMD="$REPO_ROOT/scripts/swift-tmp.sh"

echo "Admin Password Setup"
echo "==================="
echo ""
echo "This script will help you generate a hashed password for your admin account."
echo ""

# Run the Swift command
"$SWIFT_CMD" run KlaboWorld hash-password

echo ""
echo "Setup complete! Remember to restart your application after updating the environment variable."
