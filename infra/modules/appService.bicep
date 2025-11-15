// App Service plan + Web App for Containers (with staging slot)
targetScope = 'resourceGroup'

@description('Name of the App Service plan')
param planName string

@description('Name of the Web App')
param webAppName string

@description('SKU for the App Service plan (e.g., P1v3)')
param planSku string = 'P1v3'

@description('Container registry login server (e.g., acrklaboworld.azurecr.io)')
param containerRegistry string

@description('LinuxFxVersion string to use for custom containers (e.g., DOCKER|registry/image:tag)')
param linuxFxVersion string

@description('Application Insights connection string')
param appInsightsConnection string

@description('Name of Storage account for uploads (used in app settings)')
param storageAccountName string

param siteUrl string

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: planName
  location: resourceGroup().location
  sku: {
    name: planSku
    tier: 'PremiumV3'
  }
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: webAppName
  location: resourceGroup().location
  kind: 'app,linux,container'
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: linuxFxVersion
      appSettings: [
        {
          name: 'DOCKER_REGISTRY_SERVER_URL'
          value: 'https://${containerRegistry}'
        }
        {
          name: 'WEBSITES_PORT'
          value: '8080'
        }
        {
          name: 'SITE_URL'
          value: siteUrl
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsightsConnection
        }
        {
          name: 'UPLOADS_DIR'
          value: '/home/site/wwwroot/uploads'
        }
        {
          name: 'STORAGE_ACCOUNT_NAME'
          value: storageAccountName
        }
      ]
    }
  }
  identity: {
    type: 'SystemAssigned'
  }
}

resource slot 'Microsoft.Web/sites/slots@2023-12-01' = {
  name: '${webApp.name}/staging'
  location: resourceGroup().location
  properties: {
    serverFarmId: plan.id
    siteConfig: {
      linuxFxVersion: linuxFxVersion
    }
  }
}

output webAppId string = webApp.id
output principalId string = webApp.identity.principalId
output slotId string = slot.id
