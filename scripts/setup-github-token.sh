#!/bin/bash

# GitHub Token Setup Script for KlaboWorld Blog
# This script helps you set up a GitHub personal access token for blog post management

echo "==================================="
echo "GitHub Token Setup for KlaboWorld"
echo "==================================="
echo ""
echo "This script will help you create and configure a GitHub personal access token"
echo "for managing blog posts directly through the admin interface."
echo ""

# Step 1: Instructions for creating token
echo "Step 1: Create a GitHub Personal Access Token"
echo "----------------------------------------------"
echo "1. Open this URL in your browser:"
echo "   https://github.com/settings/tokens/new"
echo ""
echo "2. Configure the token:"
echo "   - Note: 'KlaboWorld Blog Admin'"
echo "   - Expiration: Choose based on your security preference"
echo "   - Scopes: Select 'repo' (Full control of private repositories)"
echo ""
echo "3. Click 'Generate token'"
echo "4. COPY THE TOKEN IMMEDIATELY (you won't see it again!)"
echo ""
read -p "Press Enter when you have copied your token..."

# Step 2: Get the token from user
echo ""
echo "Step 2: Enter Your GitHub Token"
echo "--------------------------------"
read -sp "Paste your GitHub token here (input will be hidden): " GITHUB_TOKEN
echo ""
echo ""

# Validate token format
if [[ ! "$GITHUB_TOKEN" =~ ^gh[ps]_[a-zA-Z0-9]{36,}$ ]]; then
    echo "Warning: Token format looks incorrect. GitHub tokens start with 'ghp_' or 'ghs_'"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 3: Test the token
echo "Step 3: Testing Token"
echo "---------------------"
echo "Testing token with GitHub API..."

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/user)

if [ "$RESPONSE" = "200" ]; then
    echo "✅ Token is valid!"
    
    # Get username
    USERNAME=$(curl -s \
        -H "Authorization: Bearer $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/user | grep -o '"login":"[^"]*' | cut -d'"' -f4)
    
    echo "   Authenticated as: $USERNAME"
else
    echo "❌ Token validation failed (HTTP $RESPONSE)"
    echo "   Please check your token and try again."
    exit 1
fi

# Step 4: Configure environment
echo ""
echo "Step 4: Configure Environment"
echo "-----------------------------"
echo "Choose where to configure the token:"
echo "1. Local development (.env file)"
echo "2. Azure production"
echo "3. Both"
read -p "Enter your choice (1-3): " CHOICE

case $CHOICE in
    1|3)
        # Local configuration
        echo ""
        echo "Configuring local development..."
        
        # Create .env file if it doesn't exist
        if [ ! -f .env ]; then
            cp .env.local .env 2>/dev/null || touch .env
        fi
        
        # Update or add GitHub token
        if grep -q "^GITHUB_TOKEN=" .env; then
            # On macOS use -i '' for sed
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s|^GITHUB_TOKEN=.*|GITHUB_TOKEN=$GITHUB_TOKEN|" .env
            else
                sed -i "s|^GITHUB_TOKEN=.*|GITHUB_TOKEN=$GITHUB_TOKEN|" .env
            fi
        else
            echo "GITHUB_TOKEN=$GITHUB_TOKEN" >> .env
        fi
        
        # Ensure other GitHub settings are present
        grep -q "^GITHUB_OWNER=" .env || echo "GITHUB_OWNER=joelklabo" >> .env
        grep -q "^GITHUB_REPO=" .env || echo "GITHUB_REPO=KlaboWorld" >> .env
        
        echo "✅ Local environment configured (.env file updated)"
        ;;
esac

case $CHOICE in
    2|3)
        # Azure configuration
        echo ""
        echo "Configuring Azure production..."
        echo "Running Azure CLI commands..."
        
        # Check if Azure CLI is installed
        if ! command -v az &> /dev/null; then
            echo "❌ Azure CLI not found. Please install it first:"
            echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
            exit 1
        fi
        
        # Configure Azure
        az webapp config appsettings set \
            --name klabo-world-app \
            --resource-group klabo-world-rg \
            --settings \
                GITHUB_TOKEN="$GITHUB_TOKEN" \
                GITHUB_OWNER="joelklabo" \
                GITHUB_REPO="KlaboWorld" \
            --output none
        
        if [ $? -eq 0 ]; then
            echo "✅ Azure production configured"
            echo ""
            echo "Note: The app will restart automatically to apply the new settings."
            echo "It may take a few minutes for the changes to take effect."
        else
            echo "❌ Failed to configure Azure. Please check your Azure CLI login."
        fi
        ;;
esac

# Step 5: Summary
echo ""
echo "==================================="
echo "Setup Complete!"
echo "==================================="
echo ""
echo "Your GitHub integration is now configured."
echo ""
echo "What you can do now:"
echo "- Create new blog posts through /admin/compose"
echo "- Edit existing posts (fetched from GitHub)"
echo "- Delete posts (removed from repository)"
echo ""
echo "All changes will be committed to your GitHub repository and"
echo "automatically deployed via GitHub Actions."
echo ""
echo "To test locally:"
echo "  swift run"
echo ""
echo "Then visit: http://localhost:8080/admin"
echo ""

# Cleanup sensitive data from terminal
unset GITHUB_TOKEN