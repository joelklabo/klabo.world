import crypto from 'node:crypto';
import { env } from './env';

type LogAnalyticsTable = {
  name: string;
  columns: { name: string; type: string }[];
  rows: unknown[][];
};

type LogAnalyticsQueryResult = {
  tables: LogAnalyticsTable[];
};

const workspaceId = env.LOG_ANALYTICS_WORKSPACE_ID;
const sharedKey = env.LOG_ANALYTICS_SHARED_KEY;
const appInsightsAppId = env.APPINSIGHTS_APP_ID;
const appInsightsApiKey = env.APPINSIGHTS_API_KEY;

export function hasAnalyticsConfig() {
  return Boolean((workspaceId && sharedKey) || (appInsightsAppId && appInsightsApiKey));
}

function buildSignature(date: string, contentLength: number, resource: string) {
  const method = 'POST';
  const contentType = 'application/json';
  const xHeaders = `x-ms-date:${date}`;
  const stringToHash = [method, contentLength, contentType, xHeaders, resource].join('\n');
  const decodedKey = Buffer.from(sharedKey!, 'base64');
  const encodedHash = crypto.createHmac('sha256', decodedKey).update(stringToHash, 'utf8').digest('base64');
  return `SharedKey ${workspaceId}:${encodedHash}`;
}

export async function runLogAnalyticsQuery(query: string, options: { timespan?: string } = {}): Promise<LogAnalyticsQueryResult> {
  if (workspaceId && sharedKey) {
    const resource = `/v1/workspaces/${workspaceId}/query`;
    const url = `https://api.loganalytics.io${resource}`;
    const body = JSON.stringify({
      query,
      timespan: options.timespan,
    });
    const date = new Date().toUTCString();
    const headers = new Headers({
      'Content-Type': 'application/json',
      'x-ms-date': date,
      Authorization: buildSignature(date, Buffer.byteLength(body, 'utf8'), resource),
    });

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Log Analytics query failed (${response.status}): ${text}`);
    }

    const json = (await response.json()) as LogAnalyticsQueryResult;
    return json;
  }

  if (appInsightsAppId && appInsightsApiKey) {
    const resource = `/v1/apps/${appInsightsAppId}/query`;
    const url = `https://api.applicationinsights.io${resource}`;
    const body = JSON.stringify({
      query,
      timespan: options.timespan,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        'x-api-key': appInsightsApiKey,
      }),
      body,
      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Application Insights query failed (${response.status}): ${text}`);
    }

    const json = (await response.json()) as LogAnalyticsQueryResult;
    return json;
  }

  throw new Error(
    'Log Analytics not configured. Set LOG_ANALYTICS_WORKSPACE_ID/LOG_ANALYTICS_SHARED_KEY or APPINSIGHTS_APP_ID/APPINSIGHTS_API_KEY.',
  );
}
