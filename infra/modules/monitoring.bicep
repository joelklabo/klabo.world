// Application Insights + Log Analytics workspace
targetScope = 'resourceGroup'

@description('Base name for monitoring resources.')
param baseName string

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${baseName}-law'
  location: resourceGroup().location
  properties: {
    retentionInDays: 30
    features: {
      legacy: 0
    }
  }
  sku: {
    name: 'PerGB2018'
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: baseName
  location: resourceGroup().location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Flow_Type: 'Bluefield'
    WorkspaceResourceId: logAnalytics.id
  }
}

output appInsightsConnectionString string = appInsights.properties.ConnectionString
output logAnalyticsId string = logAnalytics.id
