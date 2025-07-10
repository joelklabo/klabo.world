#!/bin/bash

# Quick Azure setup script for klabo.world authentication
# This generates a secure password and sets it in Azure

echo "🚀 Quick Azure Authentication Setup"
echo "=================================="
echo ""

# Check Azure CLI login
if ! az account show &>/dev/null; then
    echo "❌ You need to log in to Azure CLI first"
    echo "Run: az login"
    exit 1
fi

# Generate a secure random password
PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)
echo "Generated secure password: $PASSWORD"
echo ""
echo "⚠️  SAVE THIS PASSWORD! You'll need it to log in to your admin panel."
echo ""

# Generate BCrypt hash
echo "Generating BCrypt hash..."
HASH=$(echo "$PASSWORD" | swift run KlaboWorld hash-password 2>/dev/null | grep '^\$2b' | head -n 1)

if [ -z "$HASH" ]; then
    echo "❌ Failed to generate password hash"
    echo "Make sure you've built the project first: swift build"
    exit 1
fi

echo "✅ Hash generated successfully"
echo ""

# Get Azure details
echo "Enter your Azure Resource Group name (e.g., klabo-world-rg):"
read RESOURCE_GROUP
echo ""
echo "Enter your Azure App Service name (e.g., klabo-world-app):"
read APP_NAME
echo ""

# Set the admin password in Azure
echo "Setting admin password in Azure..."
az webapp config appsettings set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --settings ADMIN_PASSWORD="$HASH" \
    --output none

if [ $? -eq 0 ]; then
    echo "✅ Admin password configured successfully!"
else
    echo "❌ Failed to set admin password"
    echo ""
    echo "You can manually set it with:"
    echo "az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $APP_NAME --settings ADMIN_PASSWORD=\"$HASH\""
    exit 1
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Your admin credentials:"
echo "  URL:      https://$APP_NAME.azurewebsites.net/admin"
echo "  Username: admin"
echo "  Password: $PASSWORD"
echo ""
echo "⚠️  IMPORTANT: Save these credentials in a secure password manager!"
echo ""
echo "The app will restart automatically to apply the changes."
echo "This usually takes 30-60 seconds."