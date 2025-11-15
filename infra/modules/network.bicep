// Provisions the hub virtual network, delegated subnets, and private DNS zones
// referenced by downstream modules.
targetScope = 'resourceGroup'

@description('Name for the virtual network to create')
param vnetName string

@description('Address space for the VNet')
param addressPrefix string = '10.40.0.0/16'

@description('Subnet CIDRs for each workload segment')
param subnetPrefixes object = {
  appServiceIntegration: '10.40.1.0/24'
  postgres: '10.40.2.0/24'
  privateEndpoints: '10.40.3.0/24'
}

resource vnet 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: vnetName
  location: resourceGroup().location
  properties: {
    addressSpace: {
      addressPrefixes: [addressPrefix]
    }
    subnets: [
      {
        name: 'appServiceIntegration'
        properties: {
          addressPrefix: subnetPrefixes.appServiceIntegration
          delegations: [
            {
              name: 'delegation'
              properties: {
                serviceName: 'Microsoft.Web/serverFarms'
              }
            }
          ]
        }
      }
      {
        name: 'postgres'
        properties: {
          addressPrefix: subnetPrefixes.postgres
        }
      }
      {
        name: 'privateEndpoints'
        properties: {
          addressPrefix: subnetPrefixes.privateEndpoints
        }
      }
    ]
  }
}

resource dnsPostgres 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.postgres.database.azure.com'
  location: 'global'
}

resource dnsBlob 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.blob.core.windows.net'
  location: 'global'
}

resource dnsRedis 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.redis.cache.windows.net'
  location: 'global'
}

resource dnsVault 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.vaultcore.azure.net'
  location: 'global'
}

resource linkPostgres 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  name: '${dnsPostgres.name}/link-${vnet.name}'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnet.id
    }
  }
}

resource linkBlob 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  name: '${dnsBlob.name}/link-${vnet.name}'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnet.id
    }
  }
}

resource linkRedis 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  name: '${dnsRedis.name}/link-${vnet.name}'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnet.id
    }
  }
}

resource linkVault 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  name: '${dnsVault.name}/link-${vnet.name}'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnet.id
    }
  }
}

output vnetId string = vnet.id
output subnetIds object = {
  appServiceIntegration: resourceId('Microsoft.Network/virtualNetworks/subnets', vnet.name, 'appServiceIntegration')
  postgres: resourceId('Microsoft.Network/virtualNetworks/subnets', vnet.name, 'postgres')
  privateEndpoints: resourceId('Microsoft.Network/virtualNetworks/subnets', vnet.name, 'privateEndpoints')
}
output privateDnsZoneIds array = [
  dnsPostgres.id
  dnsBlob.id
  dnsRedis.id
  dnsVault.id
]
