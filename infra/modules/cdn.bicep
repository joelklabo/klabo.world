// Azure CDN profile + endpoint fronting storage
targetScope = 'resourceGroup'

@description('CDN profile name')
param profileName string

@description('CDN endpoint name')
param endpointName string

@description('Origin host name (e.g., storage static website endpoint).')
param originHostName string

resource profile 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: profileName
  location: 'global'
  sku: {
    name: 'Standard_Microsoft'
  }
}

resource endpoint 'Microsoft.Cdn/profiles/endpoints@2023-05-01' = {
  name: '${profile.name}/${endpointName}'
  location: 'global'
  properties: {
    isHttpAllowed: false
    isHttpsAllowed: true
    origins: [
      {
        name: 'storage-origin'
        properties: {
          hostName: originHostName
        }
      }
    ]
  }
}

output endpointHostname string = endpoint.properties.hostName
