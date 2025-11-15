import crypto from 'node:crypto';
import { env } from './env';

type LogAnalyticsTable = {
  name: string;
  columns: { name: string; type: string }[];
  rows: unknown[][];
};

export type LogAnalyticsQueryResult = {
  tables: LogAnalyticsTable[];
};

const workspaceId = env.LOG_ANALYTICS_WORKSPACE_ID;
const sharedKey = env.LOG_ANALYTICS_SHARED_KEY;

function ensureConfig() {
  if (!workspaceId || !sharedKey) {
    throw new Error('LOG_ANALYTICS_WORKSPACE_ID and LOG_ANALYTICS_SHARED_KEY must be set to run queries.');
  }
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
  ensureConfig();
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
