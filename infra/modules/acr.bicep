// Container registry for build artifacts
targetScope = 'resourceGroup'

@description('Name of the Azure Container Registry.')
param registryName string

@description('SKU for the ACR instance.')
param sku string = 'Premium'

resource acr 'Microsoft.ContainerRegistry/registries@2023-06-01-preview' = {
  name: registryName
  location: resourceGroup().location
  sku: {
    name: sku
  }
  properties: {
    adminUserEnabled: false
    policies: {
      quarantinePolicy: {
        status: 'disabled'
      }
      retentionPolicy: {
        days: 7
        status: 'enabled'
      }
    }
  }
}

output registryId string = acr.id
output loginServer string = acr.properties.loginServer
