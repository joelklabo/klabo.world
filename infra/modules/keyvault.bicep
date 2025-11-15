// Key Vault for application secrets
targetScope = 'resourceGroup'

@description('Key Vault name')
param keyVaultName string

@description('Tenant ID for access policies / RBAC')
param tenantId string

@description('Object IDs to grant secret permissions (e.g., pipeline principal, human break-glass account).')
param accessObjectIds array

resource kv 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: resourceGroup().location
  properties: {
    tenantId: tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    enableRbacAuthorization: true
    enabledForDeployment: false
    enabledForTemplateDeployment: false
    enabledForDiskEncryption: false
    publicNetworkAccess: 'Enabled'
    accessPolicies: [
      for objectId in accessObjectIds: {
        tenantId: tenantId
        objectId: objectId
        permissions: {
          secrets: [
            'get'
            'list'
            'set'
            'delete'
          ]
        }
      }
    ]
  }
}

output keyVaultId string = kv.id
