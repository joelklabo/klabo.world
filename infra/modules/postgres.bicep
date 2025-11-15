// Azure Database for PostgreSQL Flexible Server
targetScope = 'resourceGroup'

@description('Name of the PostgreSQL flexible server.')
param serverName string

@description('Administrator username for the server.')
param administratorLogin string

@secure()
@description('Administrator password for the server.')
param administratorLoginPassword string

@description('Tier for the server (e.g., GeneralPurpose).')
param skuTier string = 'GeneralPurpose'

@description('Compute SKU name (e.g., Standard_D2ads_v5).')
param skuName string = 'Standard_D2ads_v5'

@description('Storage size in GiB.')
param storageSizeGB int = 128

@description('Delegated subnet ID for VNet integration.')
param delegatedSubnetId string

resource server 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: serverName
  location: resourceGroup().location
  sku: {
    tier: skuTier
    name: skuName
  }
  properties: {
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorLoginPassword
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'SameZone'
    }
    storage: {
      storageSizeGB: storageSizeGB
    }
    network: {
      delegatedSubnetResourceId: delegatedSubnetId
      publicNetworkAccess: 'Disabled'
    }
    version: '16'
  }
}

resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-06-01-preview' = {
  name: '${server.name}/app'
}

output serverId string = server.id
output fqdn string = server.properties.fullyQualifiedDomainName
