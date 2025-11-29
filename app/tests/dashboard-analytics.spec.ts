import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Dashboard } from '../src/lib/dashboards';

const chartDashboard: Dashboard = {
  slug: 'test-chart',
  title: 'Test Chart',
  summary: '',
  panelType: 'chart',
  kqlQuery: 'requests | take 1',
  body: { raw: '' },
};

const logsDashboard: Dashboard = {
  slug: 'test-logs',
  title: 'Test Logs',
  summary: '',
  panelType: 'logs',
  kqlQuery: 'requests | take 1',
  body: { raw: '' },
};

function resetEnv() {
  delete process.env.LOG_ANALYTICS_WORKSPACE_ID;
  delete process.env.LOG_ANALYTICS_SHARED_KEY;
  delete process.env.APPINSIGHTS_APP_ID;
  delete process.env.APPINSIGHTS_API_KEY;
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  vi.unstubAllGlobals();
  resetEnv();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  resetEnv();
});

describe('dashboard analytics config', () => {
  it('disables chart panel when no analytics credentials are configured', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const { loadDashboardChartState } = await import('../src/lib/dashboardCharts');

    const state = await loadDashboardChartState(chartDashboard);

    expect(state.status).toBe('disabled');
    expect('reason' in state ? state.reason : '').toMatch(/Log Analytics not configured/i);
  });

  it('uses App Insights fallback for charts when workspace keys are missing', async () => {
    process.env.APPINSIGHTS_APP_ID = 'app-id';
    process.env.APPINSIGHTS_API_KEY = 'api-key';

    const mockResponse = {
      tables: [
        {
          name: 'PrimaryResult',
          columns: [
            { name: 'timestamp', type: 'datetime' },
            { name: 'value', type: 'long' },
          ],
          rows: [['2025-01-01T00:00:00Z', 7]],
        },
      ],
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const { loadDashboardChartState } = await import('../src/lib/dashboardCharts');
    const state = await loadDashboardChartState(chartDashboard);

    expect(state.status).toBe('success');
    expect(state.points[0]?.value).toBe(7);
    expect(fetchMock).toHaveBeenCalled();
  });

  it('uses App Insights fallback for logs and normalizes severity', async () => {
    process.env.APPINSIGHTS_APP_ID = 'app-id';
    process.env.APPINSIGHTS_API_KEY = 'api-key';

    const mockResponse = {
      tables: [
        {
          name: 'PrimaryResult',
          columns: [
            { name: 'timestamp', type: 'datetime' },
            { name: 'message', type: 'string' },
            { name: 'severityLevel', type: 'int' },
          ],
          rows: [['2025-01-01T00:00:00Z', 'hello world', 2]],
        },
      ],
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const { loadDashboardLogs } = await import('../src/lib/dashboardLogs');
    const state = await loadDashboardLogs(logsDashboard);

    expect(state.status).toBe('success');
    expect(state.entries[0]?.message).toBe('hello world');
    expect(state.entries[0]?.severity).toBe('Information');
    expect(fetchMock).toHaveBeenCalled();
  });
});
