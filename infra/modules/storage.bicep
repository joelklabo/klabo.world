// Storage account for uploads and CDN origins
targetScope = 'resourceGroup'

@description('Storage account name (must be globally unique).')
param storageAccountName string

@description('Tier for the storage account.')
param skuName string = 'Standard_LRS'

@description('Toggle hierarchical namespace for future ADLS scenarios.')
param enableHns bool = false

@description('Blob containers to create within the storage account.')
param containers array = [
  'public-assets'
  'draft-uploads'
]

resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: resourceGroup().location
  sku: {
    name: skuName
  }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    isHnsEnabled: enableHns
  }
}

resource blobContainers 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = [for containerName in containers: {
  name: '${storage.name}/default/${containerName}'
  properties: {
    publicAccess: 'None'
  }
}]

output storageAccountId string = storage.id
output primaryEndpoints object = storage.properties.primaryEndpoints
output containerNames array = containers
