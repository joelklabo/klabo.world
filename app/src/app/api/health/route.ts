import { NextResponse } from 'next/server';

type HealthComponentStatus = {
  status: 'ok' | 'failed' | 'skipped';
  message?: string;
  latencyMs?: number;
};

type HealthComponents = {
  db: HealthComponentStatus;
  redis: HealthComponentStatus;
  blob: HealthComponentStatus;
};

let cachedRunHealthChecks: (() => Promise<{ components: HealthComponents; hasFailure: boolean }>) | null = null;

function missing(value?: string | null) {
  return !value || value.trim() === '';
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}

export async function GET() {
  let components: HealthComponents;
  let hasFailure = false;
  let healthError: string | undefined;

  try {
    if (!cachedRunHealthChecks) {
      const { runHealthChecks } = await import('../../../lib/healthChecks');
      cachedRunHealthChecks = runHealthChecks;
    }
    const result = await cachedRunHealthChecks();
    components = result.components;
    hasFailure = result.hasFailure;
  } catch (error) {
    console.error('[health] health checks failed to initialize', error);
    const message = errorMessage(error);
    const safeMessage = process.env.NODE_ENV === 'production' ? 'Health checks failed to initialize.' : message;
    healthError = safeMessage;
    components = {
      db: { status: 'failed', message: safeMessage },
      redis: { status: 'failed', message: safeMessage },
      blob: { status: 'failed', message: safeMessage },
    };
    hasFailure = true;
  }
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
  const status = hasFailure ? 'degraded' : 'ok';

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.BUILD_VERSION ?? 'dev',
      missingSecrets,
      gistToken: hasGistToken ? 'configured' : 'missing',
      components,
      ...(healthError ? { error: healthError } : {}),
    },
    { status: hasFailure ? 503 : 200 },
  );
}
