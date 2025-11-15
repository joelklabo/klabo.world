// Azure Cache for Redis for rate limiting
targetScope = 'resourceGroup'

@description('Redis cache name')
param redisName string

@description('SKU / size for Redis cache')
param skuName string = 'Standard'

@description('Redis capacity (0=250MB, 1=1GB, etc).')
param capacity int = 0

resource redis 'Microsoft.Cache/Redis@2023-04-01' = {
  name: redisName
  location: resourceGroup().location
  properties: {
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
  }
  sku: {
    name: skuName
    family: skuName == 'Premium' ? 'P' : skuName == 'Standard' ? 'C' : 'B'
    capacity: capacity
  }
}

output redisHostName string = redis.properties.hostName
