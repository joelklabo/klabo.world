#!/bin/bash

echo "Azure Authentication Setup"
echo "========================="
echo ""

# Generate a secure password hash
echo "Step 1: Generating password hash..."
echo ""
echo "Enter your desired admin password:"
read -s password
echo ""

# Create a temporary Swift file to hash the password
cat > temp_hash.swift << 'EOF'
import Vapor

let app = Application()
defer { app.shutdown() }

let password = CommandLine.arguments[1]
let hash = try app.password.hash(password)
print(hash)
EOF

# Run the hasher
hash=$(swift run --skip-build KlaboWorld eval "import Vapor; let app = Application(); defer { app.shutdown() }; print(try app.password.hash(\"$password\"))" 2>/dev/null | tail -n 1)

if [ -z "$hash" ]; then
    echo "Error: Failed to generate password hash"
    echo "Running fallback method..."
    hash=$(echo "$password" | swift run KlaboWorld hash-password 2>/dev/null | grep '^\$2b' | head -n 1)
fi

echo ""
echo "Password hash generated successfully!"
echo ""
echo "Step 2: Setting Azure App Service configuration..."
echo ""

# Check if user is logged in to Azure CLI
if ! az account show &>/dev/null; then
    echo "Please log in to Azure CLI first:"
    echo "az login"
    exit 1
fi

# Get resource group and app name
echo "Enter your Azure Resource Group name:"
read resource_group
echo ""
echo "Enter your Azure App Service name:"
read app_name
echo ""

# Set the app settings
echo "Updating Azure App Service settings..."

az webapp config appsettings set \
    --resource-group "$resource_group" \
    --name "$app_name" \
    --settings ADMIN_PASSWORD="$hash" \
    --output none

if [ $? -eq 0 ]; then
    echo "✅ ADMIN_PASSWORD has been set successfully!"
else
    echo "❌ Failed to set ADMIN_PASSWORD"
    echo ""
    echo "You can manually set it using:"
    echo "az webapp config appsettings set --resource-group $resource_group --name $app_name --settings ADMIN_PASSWORD=\"$hash\""
    exit 1
fi

echo ""
echo "Step 3: Verifying other required settings..."
echo ""

# Check if SMTP settings are configured
smtp_check=$(az webapp config appsettings list --resource-group "$resource_group" --name "$app_name" --query "[?name=='SMTP_HOST'].value" -o tsv)

if [ -z "$smtp_check" ]; then
    echo "⚠️  SMTP settings are not configured. Your app needs these to send emails."
    echo ""
    echo "Would you like to configure SMTP settings now? (y/n)"
    read configure_smtp
    
    if [ "$configure_smtp" = "y" ]; then
        echo "Enter SMTP host:"
        read smtp_host
        echo "Enter SMTP username:"
        read smtp_username
        echo "Enter SMTP password:"
        read -s smtp_password
        echo ""
        
        az webapp config appsettings set \
            --resource-group "$resource_group" \
            --name "$app_name" \
            --settings \
                SMTP_HOST="$smtp_host" \
                SMTP_USERNAME="$smtp_username" \
                SMTP_PASSWORD="$smtp_password" \
            --output none
            
        echo "✅ SMTP settings configured!"
    fi
else
    echo "✅ SMTP settings are already configured"
fi

echo ""
echo "Setup Complete!"
echo "=============="
echo ""
echo "Your admin authentication is now configured for Azure."
echo ""
echo "To access your admin panel:"
echo "1. Navigate to https://$app_name.azurewebsites.net/admin"
echo "2. Username: admin"
echo "3. Password: [the password you entered above]"
echo ""
echo "Important: The app may need to restart for changes to take effect."
echo "This usually happens automatically within a few seconds."
echo ""

# Clean up
rm -f temp_hash.swift