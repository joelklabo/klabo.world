#!/bin/bash

echo "Admin Password Setup"
echo "==================="
echo ""
echo "This script will help you generate a hashed password for your admin account."
echo ""

# Run the Swift command
swift run KlaboWorld hash-password

echo ""
echo "Setup complete! Remember to restart your application after updating the environment variable."