# Azure Authentication Setup Instructions

## Quick Setup (Recommended)

Run the automated setup script that generates a secure password for you:

```bash
./azure-quick-setup.sh
```

This script will:
1. Generate a secure random password
2. Create a BCrypt hash
3. Set it in your Azure App Service
4. Display your login credentials

## Manual Setup

If you prefer to use your own password:

```bash
./azure-auth-setup.sh
```

This interactive script will:
1. Prompt for your desired password
2. Generate the BCrypt hash
3. Configure Azure App Service
4. Optionally set up SMTP settings

## Direct Azure CLI Commands

If you already have a password hash, you can set it directly:

```bash
# Set admin password (must be BCrypt hashed!)
az webapp config appsettings set \
  --resource-group klabo-world-rg \
  --name klabo-world-app \
  --settings ADMIN_PASSWORD="$2b$12$Xg6EVbfZ5YKzMbqwi0muBeDqidNlRa3lPC86.f6nzqzcP3w950MeO"
```

## Verify Settings

Check all configured app settings:

```bash
az webapp config appsettings list \
  --resource-group klabo-world-rg \
  --name klabo-world-app \
  --output table
```

## Important Notes

1. **Password Hash Required**: The ADMIN_PASSWORD must be a BCrypt hash, not plain text
2. **App Restart**: Azure will automatically restart your app after updating settings
3. **Login URL**: Access your admin panel at `https://your-app.azurewebsites.net/admin`
4. **Username**: Always `admin` (hardcoded)

## Troubleshooting

### Cannot generate hash
Make sure you've built the project first:
```bash
swift build
```

### Login not working
1. Check logs: `az webapp log tail --name klabo-world-app --resource-group klabo-world-rg`
2. Verify the hash was set: `az webapp config appsettings list --name klabo-world-app --resource-group klabo-world-rg --query "[?name=='ADMIN_PASSWORD'].value" -o tsv`
3. Wait 30-60 seconds for the app to restart after setting changes

### Forgot password
Simply run either setup script again to generate a new password and hash.