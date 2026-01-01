import { NextResponse } from 'next/server';
function missing(value?: string | null) {
  return !value || value.trim() === '';
}

export async function GET() {
  const missingSecrets: string[] = [];
  if (missing(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)) {
    missingSecrets.push('APPLICATIONINSIGHTS_CONNECTION_STRING');
  }
  const hasLogAnalytics =
    !missing(process.env.LOG_ANALYTICS_WORKSPACE_ID) && !missing(process.env.LOG_ANALYTICS_SHARED_KEY);
  const hasAppInsightsApi =
    !missing(process.env.APPINSIGHTS_APP_ID) && !missing(process.env.APPINSIGHTS_API_KEY);
  if (!hasLogAnalytics && !hasAppInsightsApi) {
    missingSecrets.push('LOG_ANALYTICS_WORKSPACE_ID/LOG_ANALYTICS_SHARED_KEY or APPINSIGHTS_APP_ID/APPINSIGHTS_API_KEY');
  }
  const hasGistToken = !missing(process.env.GITHUB_TOKEN);

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.BUILD_VERSION ?? 'dev',
    missingSecrets,
    gistToken: hasGistToken ? 'configured' : 'missing',
  });
}
