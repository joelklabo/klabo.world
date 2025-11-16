// Application Insights + Log Analytics workspace
targetScope = 'resourceGroup'

@description('Base name for monitoring resources.')
param baseName string

@description('Email address for alert notifications.')
param alertEmailAddress string = 'admin@klabo.world'

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

resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: '${baseName}-ag'
  location: 'Global'
  properties: {
    groupShortName: baseName
    enabled: true
    emailReceivers: [
      {
        name: 'Admin Email'
        emailAddress: alertEmailAddress
        useCommonAlertSchema: true
      }
    ]
  }
}

resource pageLoadTimeAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${baseName}-page-load-time-alert'
  location: 'global'
  properties: {
    description: 'Alert when the 95th percentile of page load time is greater than 500ms.'
    severity: 2
    enabled: true
    scopes: [
      appInsights.id
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          criterionType: 'StaticThresholdCriterion'
          name: 'PageLoadTime'
          metricName: 'browserTimings/totalDuration'
          metricNamespace: 'microsoft.insights/components'
          operator: 'GreaterThan'
          threshold: 500
          timeAggregation: 'Percentile95'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

resource apiResponseTimeAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${baseName}-api-response-time-alert'
  location: 'global'
  properties: {
    description: 'Alert when the 95th percentile of API response time is greater than 300ms.'
    severity: 2
    enabled: true
    scopes: [
      appInsights.id
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          criterionType: 'StaticThresholdCriterion'
          name: 'ApiResponseTime'
          metricName: 'requests/duration'
          metricNamespace: 'microsoft.insights/components'
          operator: 'GreaterThan'
          threshold: 300
          timeAggregation: 'Percentile95'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

resource errorRateAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${baseName}-error-rate-alert'
  location: 'global'
  properties: {
    description: 'Alert when the percentage of failed requests is greater than 0.1%.'
    severity: 1
    enabled: true
    scopes: [
      appInsights.id
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          criterionType: 'StaticThresholdCriterion'
          name: 'ErrorRate'
          metricName: 'requests/failed'
          metricNamespace: 'microsoft.insights/components'
          operator: 'GreaterThan'
          threshold: 0.1
          timeAggregation: 'Average'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

output appInsightsConnectionString string = appInsights.properties.ConnectionString
output logAnalyticsId string = logAnalytics.id
