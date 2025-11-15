// Subscription-scoped deployment that provisions the Azure resources for klabo.world
// Usage: az deployment sub create --template-file infra/main.bicep --location <region> --parameters @infra/envs/prod.json

targetScope = 'subscription'

@description('Name of the resource group to provision.')
param resourceGroupName string

@description('Azure region for the resource group.')
param location string

@description('Common tags to apply to resources.')
param tags object = {
  workload: 'klaboworld'
}

@description('Virtual network name.')
param vnetName string

@description('Storage account name (must be globally unique).')
param storageAccountName string

@description('Key Vault name.')
param keyVaultName string

@description('Managed identity/object IDs that need secret permissions (pipelines, break-glass).')
param keyVaultAccessObjectIds array

@description('Azure tenant ID for Key Vault.')
param tenantId string = subscription().tenantId

@description('ACR name (must be globally unique).')
param acrName string

@description('Redis cache name.')
param redisName string

@description('PostgreSQL flexible server name.')
param postgresServerName string

@description('Admin login for PostgreSQL flexible server.')
param postgresAdminLogin string = 'klabo_admin'

@secure()
@description('Admin password for PostgreSQL flexible server.')
param postgresAdminPassword string

@description('App Service plan name.')
param appServicePlanName string

@description('Primary web app name.')
param webAppName string

@description('Docker image (including repo + tag) to deploy, e.g., klaboworld/web:latest')
param containerImage string

@description('Live site URL (used for app settings).')
param siteUrl string

@description('CDN profile name.')
param cdnProfileName string

@description('CDN endpoint name.')
param cdnEndpointName string

var rgLocation = location
var linuxFxVersion = 'DOCKER|${acrName}.azurecr.io/${containerImage}'

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: rgLocation
  tags: tags
}

module network 'modules/network.bicep' = {
  name: 'network'
  scope: rg
  params: {
    vnetName: vnetName
  }
}

module storage 'modules/storage.bicep' = {
  name: 'storage'
  scope: rg
  params: {
    storageAccountName: storageAccountName
  }
}

module acr 'modules/acr.bicep' = {
  name: 'acr'
  scope: rg
  params: {
    registryName: acrName
  }
}

module kv 'modules/keyvault.bicep' = {
  name: 'keyvault'
  scope: rg
  params: {
    keyVaultName: keyVaultName
    tenantId: tenantId
    accessObjectIds: keyVaultAccessObjectIds
  }
}

module redis 'modules/redis.bicep' = {
  name: 'redis'
  scope: rg
  params: {
    redisName: redisName
  }
}

module postgres 'modules/postgres.bicep' = {
  name: 'postgres'
  scope: rg
  params: {
    serverName: postgresServerName
    administratorLogin: postgresAdminLogin
    administratorLoginPassword: postgresAdminPassword
    delegatedSubnetId: network.outputs.subnetIds.postgres
  }
}

module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring'
  scope: rg
  params: {
    baseName: '${webAppName}-appi'
  }
}

module appService 'modules/appService.bicep' = {
  name: 'appservice'
  scope: rg
  params: {
    planName: appServicePlanName
    webAppName: webAppName
    planSku: 'P1v3'
    containerRegistry: '${acrName}.azurecr.io'
    linuxFxVersion: linuxFxVersion
    appInsightsConnection: monitoring.outputs.appInsightsConnectionString
    storageAccountName: storageAccountName
    siteUrl: siteUrl
  }
}

module cdn 'modules/cdn.bicep' = {
  name: 'cdn'
  scope: rg
  params: {
    profileName: cdnProfileName
    endpointName: cdnEndpointName
    originHostName: '${storageAccountName}.blob.${environment().suffixes.storage}'
  }
}

output resourceGroupId string = rg.id
output vnetId string = network.outputs.vnetId
output storageAccountId string = storage.outputs.storageAccountId
output webAppId string = appService.outputs.webAppId
