import { type Dashboard } from './dashboards';
import { hasAnalyticsConfig, runLogAnalyticsQuery } from './logAnalytics';

const NUMBER_COLUMN_TYPES = new Set(['long', 'real', 'double', 'decimal', 'int', 'number']);

export type DashboardChartPoint = {
  timestamp: string;
  label: string;
  value: number;
};

export type DashboardChartState =
  | { status: 'disabled'; reason: string }
  | { status: 'empty'; reason: string }
  | { status: 'error'; message: string }
  | { status: 'success'; points: DashboardChartPoint[]; valueLabel: string; refreshedAt: string };

function formatLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function loadDashboardChartState(dashboard: Dashboard): Promise<DashboardChartState> {
  if (dashboard.panelType !== 'chart') {
    return { status: 'disabled', reason: 'Panel is not a chart.' };
  }

  if (!dashboard.kqlQuery) {
    return { status: 'disabled', reason: 'No KQL query configured yet.' };
  }

  if (!hasAnalyticsConfig()) {
    return { status: 'disabled', reason: 'Log Analytics not configured (set LOG_ANALYTICS_* or APPINSIGHTS_* env vars).' };
  }

  try {
    const result = await runLogAnalyticsQuery(dashboard.kqlQuery, { timespan: 'P30D' });
    const table = result.tables.find((candidate) => candidate.columns.some((column) => column.type === 'datetime'));
    if (!table) {
      return { status: 'empty', reason: 'Query returned no datetime columns.' };
    }

    const timestampIndex = table.columns.findIndex((column) => column.type === 'datetime');
    if (timestampIndex === -1) {
      return { status: 'empty', reason: 'Query results missing timestamp column.' };
    }

    let valueIndex = table.columns.findIndex((column, index) => index !== timestampIndex && NUMBER_COLUMN_TYPES.has(column.type));
    if (valueIndex === -1) {
      valueIndex = table.columns.findIndex((_, index) => index !== timestampIndex);
    }

    if (valueIndex === -1) {
      return { status: 'empty', reason: 'Query results missing numeric value column.' };
    }

    const valueColumn = table.columns[valueIndex]?.name ?? 'value';

    const points: DashboardChartPoint[] = table.rows
      .map((row) => {
        const rawTimestamp = row[timestampIndex];
        if (!rawTimestamp) return null;
        const date = new Date(rawTimestamp as string);
        if (Number.isNaN(date.getTime())) return null;
        const normalizedValue = normalizeNumber(row[valueIndex]);
        if (normalizedValue === null) return null;
        return {
          timestamp: date.toISOString(),
          label: formatLabel(date),
          value: normalizedValue,
        };
      })
      .filter(Boolean);

    if (points.length === 0) {
      return { status: 'empty', reason: 'Query returned no data points.' };
    }

    return {
      status: 'success',
      points,
      valueLabel: valueColumn,
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error while running query.';
    return { status: 'error', message };
  }
}
