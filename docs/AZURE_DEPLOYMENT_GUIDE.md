# Azure App Service Deployment Guide for klabo.world

This guide provides a complete walkthrough for deploying your Vapor 4 application to Azure App Service using containers, with step-by-step instructions and exact Azure CLI commands.

## Prerequisites

- Azure CLI installed (`brew install azure-cli` on macOS)
- Azure subscription
- Docker image pushed to GitHub Container Registry (handled by CI/CD)
- Azure account with permissions to create resources

## Step 1: Azure Login and Initial Setup

```bash
# Login to Azure
az login

# List available subscriptions (if you have multiple)
az account list --output table

# Set your active subscription (replace with your subscription ID)
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Verify you're on the correct subscription
az account show --output table
```

## Step 2: Create Resource Group

A resource group is a logical container for all related Azure resources.

```bash
# Create resource group
az group create \
  --name klabo-world-rg \
  --location westus

# Verify creation
az group show --name klabo-world-rg --output table
```

## Step 3: Create App Service Plan

The App Service Plan defines the compute resources for your web app. We'll use a Linux container plan.

```bash
# Create App Service Plan (B1 tier for small sites, P1V2 for production)
az appservice plan create \
  --name klabo-world-plan \
  --resource-group klabo-world-rg \
  --is-linux \
  --sku B1

# For production workloads, use P1V2 or higher:
# --sku P1V2
```

### Available SKU Options:
- **F1**: Free tier (limited resources, no custom domains)
- **B1**: Basic tier (1.75 GB RAM, custom domains, SSL)
- **B2**: Basic tier (3.5 GB RAM)
- **P1V2**: Premium tier (3.5 GB RAM, autoscale, staging slots)
- **P2V2**: Premium tier (7 GB RAM)

## Step 4: Create Web App for Containers

```bash
# Create the web app configured for containers
az webapp create \
  --resource-group klabo-world-rg \
  --plan klabo-world-plan \
  --name klabo-world-app \
  --deployment-container-image-name "mcr.microsoft.com/appsvc/staticsite:latest"

# Note: We set a placeholder image; GitHub Actions will deploy the actual image
```

## Step 5: Configure Container Settings

```bash
# Configure the web app to use GitHub Container Registry
az webapp config container set \
  --name klabo-world-app \
  --resource-group klabo-world-rg \
  --docker-custom-image-name "ghcr.io/YOUR_GITHUB_USERNAME/klabo.world/image:latest" \
  --docker-registry-server-url "https://ghcr.io"

# Enable continuous deployment from container registry
az webapp deployment container config \
  --name klabo-world-app \
  --resource-group klabo-world-rg \
  --enable-cd true
```

## Step 6: Configure Environment Variables

Set all required environment variables for your Vapor application:

```bash
# Set the port (required for Vapor)
az webapp config appsettings set \
  --name klabo-world-app \
  --resource-group klabo-world-rg \
  --settings WEBSITES_PORT=8080

# Set SMTP configuration
az webapp config appsettings set \
  --name klabo-world-app \
  --resource-group klabo-world-rg \
  --settings \
    SMTP_HOST="smtp.sendgrid.net" \
    SMTP_USERNAME="apikey" \
    SMTP_PASSWORD="YOUR_SENDGRID_API_KEY" \
    ADMIN_PASSWORD="YOUR_SECURE_ADMIN_PASSWORD"

# Set persistent storage path
az webapp config appsettings set \
  --name klabo-world-app \
  --resource-group klabo-world-rg \
  --settings UPLOADS_DIR="/home/site/wwwroot/uploads"

# Set Google Analytics (optional)
az webapp config appsettings set \
  --name klabo-world-app \
  --resource-group klabo-world-rg \
  --settings GA_TRACKING_ID="UA-XXXXXXXXX-X"

# Set any additional environment variables
az webapp config appsettings set \
  --name klabo-world-app \
  --resource-group klabo-world-rg \
  --settings \
    LOG_LEVEL="notice" \
    ENVIRONMENT="production"
```

### View all configured settings:
```bash
az webapp config appsettings list \
  --name klabo-world-app \
  --resource-group klabo-world-rg \
  --output table
```

## Step 7: Configure Persistent Storage

Azure App Service provides persistent storage at `/home`. Create the uploads directory structure:

```bash
# Enable the storage account for the app
az webapp config storage-account add \
  --name klabo-world-app \
  --resource-group klabo-world-rg \
  --storage-type AzureFiles \
  --account-name "$(az storage account list --resource-group klabo-world-rg --query '[0].name' -o tsv)" \
  --share-name uploads \
  --access-key "$(az storage account keys list --resource-group klabo-world-rg --account-name $(az storage account list --resource-group klabo-world-rg --query '[0].name' -o tsv) --query '[0].value' -o tsv)" \
  --mount-path /home/site/wwwroot/uploads \
  --custom-id uploads
```

### Alternative: Use App Service's built-in storage
The `/home` directory is persistent by default in App Service. Your app just needs to ensure the directory exists:

```swift
// In your Vapor app's configure.swift
let uploadsPath = config.uploadsDir
try FileManager.default.createDirectory(atPath: uploadsPath, withIntermediateDirectories: true)
```

## Step 8: Get Publish Profile for GitHub Actions

The publish profile contains deployment credentials for GitHub Actions:

```bash
# Download the publish profile
az webapp deployment list-publishing-profiles \
  --name klabo-world-app \
  --resource-group klabo-world-rg \
  --xml \
  --output tsv > publish-profile.xml

# IMPORTANT: This file contains sensitive credentials!
# Copy its contents and add to GitHub Secrets as AZURE_WEBAPP_PUBLISH_PROFILE
# Then delete the local file:
rm publish-profile.xml
```

### Add to GitHub Secrets:
1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
5. Value: Paste the entire XML content
6. Click "Add secret"

## Step 9: Configure Logging and Monitoring

Enable application logging to troubleshoot issues:

```bash
# Enable application logging
az webapp log config \
  --name klabo-world-app \
  --resource-group klabo-world-rg \
  --application-logging filesystem \
  --level information \
  --web-server-logging filesystem

# Enable detailed error messages
az webapp config set \
  --name klabo-world-app \
  --resource-group klabo-world-rg \
  --detailed-error-logging-enabled true \
  --failed-request-tracing-enabled true
```

### View logs in real-time:
```bash
# Stream logs
az webapp log tail \
  --name klabo-world-app \
  --resource-group klabo-world-rg

# Download logs
az webapp log download \
  --name klabo-world-app \
  --resource-group klabo-world-rg \
  --log-file logs.zip
```

## Step 10: Configure Custom Domain (Optional)

If you have a custom domain:

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name klabo-world-app \
  --resource-group klabo-world-rg \
  --hostname www.klabo.world

# Add root domain
az webapp config hostname add \
  --webapp-name klabo-world-app \
  --resource-group klabo-world-rg \
  --hostname klabo.world
```

### DNS Configuration:
Add these records to your DNS provider:
- **A Record**: `@` → Azure Web App IP (get with `az webapp show`)
- **CNAME Record**: `www` → `klabo-world-app.azurewebsites.net`

### Enable HTTPS:
```bash
# Create managed certificate for custom domain
az webapp config ssl create \
  --name klabo-world-app \
  --resource-group klabo-world-rg \
  --hostname www.klabo.world

# Bind SSL certificate
az webapp config ssl bind \
  --name klabo-world-app \
  --resource-group klabo-world-rg \
  --certificate-thumbprint "THUMBPRINT_FROM_PREVIOUS_COMMAND" \
  --ssl-type SNI
```

## Step 11: Configure Auto-scaling (Optional)

For production workloads, configure auto-scaling:

```bash
# Enable autoscale
az monitor autoscale create \
  --resource-group klabo-world-rg \
  --resource klabo-world-plan \
  --resource-type Microsoft.Web/serverfarms \
  --name klabo-world-autoscale \
  --min-count 1 \
  --max-count 3 \
  --count 1

# Add CPU-based scaling rule
az monitor autoscale rule create \
  --resource-group klabo-world-rg \
  --autoscale-name klabo-world-autoscale \
  --condition "Percentage CPU > 70 avg 5m" \
  --scale out 1

az monitor autoscale rule create \
  --resource-group klabo-world-rg \
  --autoscale-name klabo-world-autoscale \
  --condition "Percentage CPU < 25 avg 5m" \
  --scale in 1
```

## Step 12: Configure Backup (Optional)

Set up automated backups:

```bash
# Create storage account for backups
az storage account create \
  --name klaboworldbackups \
  --resource-group klabo-world-rg \
  --location eastus \
  --sku Standard_LRS

# Configure backup
az webapp config backup create \
  --resource-group klabo-world-rg \
  --webapp-name klabo-world-app \
  --backup-name daily-backup \
  --container-url "$(az storage account show-connection-string --name klaboworldbackups --resource-group klabo-world-rg --query connectionString -o tsv)" \
  --frequency 1d \
  --retain-one true \
  --retention-period-in-days 30
```

## Deployment Checklist

Before deploying, ensure:

- [ ] All environment variables are set in Azure
- [ ] Publish profile is added to GitHub Secrets
- [ ] Container registry access is configured
- [ ] Persistent storage path matches your app configuration
- [ ] WEBSITES_PORT is set to 8080
- [ ] Logging is enabled for troubleshooting
- [ ] Your Vapor app binds to 0.0.0.0:8080

## Troubleshooting

### Container won't start:
```bash
# Check container logs
az webapp log tail --name klabo-world-app --resource-group klabo-world-rg

# Verify environment variables
az webapp config appsettings list --name klabo-world-app --resource-group klabo-world-rg
```

### 502 Bad Gateway:
- Verify WEBSITES_PORT=8080 is set
- Check that Vapor binds to 0.0.0.0, not localhost
- Review container startup logs

### File uploads not persisting:
- Verify UPLOADS_DIR points to /home/site/wwwroot/uploads
- Check FileMiddleware configuration serves from persistent path
- Ensure directory creation logic in your app

### Performance issues:
- Scale up App Service Plan (B1 → P1V2)
- Enable Application Insights for detailed metrics
- Review Vapor app for optimization opportunities

## Cost Optimization

- Use B1 tier for development/staging
- P1V2 for production (includes autoscale)
- Enable autoscaling to handle traffic spikes
- Use Azure CDN for static assets
- Monitor costs with Azure Cost Management

## Next Steps

1. Deploy your application using GitHub Actions
2. Monitor logs during first deployment
3. Test all functionality (blog, admin, uploads)
4. Configure custom domain if needed
5. Set up monitoring alerts
6. Document any app-specific configurations

## Useful Commands Reference

```bash
# View app status
az webapp show --name klabo-world-app --resource-group klabo-world-rg

# Restart app
az webapp restart --name klabo-world-app --resource-group klabo-world-rg

# Stop app
az webapp stop --name klabo-world-app --resource-group klabo-world-rg

# Start app
az webapp start --name klabo-world-app --resource-group klabo-world-rg

# View deployment history
az webapp deployment list --name klabo-world-app --resource-group klabo-world-rg

# SSH into container (if enabled)
az webapp ssh --name klabo-world-app --resource-group klabo-world-rg
```
