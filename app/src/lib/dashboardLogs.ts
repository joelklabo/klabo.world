import { type Dashboard } from './dashboards';
import { runLogAnalyticsQuery } from './logAnalytics';

const TEXT_COLUMN_TYPES = new Set(['string', 'guid']);
const SEVERITY_NUMERIC_MAP: Record<number, string> = {
  0: 'Verbose',
  1: 'Trace',
  2: 'Information',
  3: 'Warning',
  4: 'Error',
  5: 'Critical',
};

export type DashboardLogEntry = {
  id: string;
  timestamp: string;
  message: string;
  severity?: string;
  operationName?: string;
  category?: string;
};

export type DashboardLogsState =
  | { status: 'disabled'; reason: string }
  | { status: 'error'; message: string }
  | { status: 'empty'; reason: string }
  | { status: 'success'; entries: DashboardLogEntry[]; refreshedAt: string };

type LogOptions = {
  search?: string;
  severity?: string;
  limit?: number;
};

function normalizeSeverity(value: unknown): string | undefined {
  if (typeof value === 'number') {
    return SEVERITY_NUMERIC_MAP[value] ?? `Level ${value}`;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return undefined;
    }
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      return SEVERITY_NUMERIC_MAP[numeric] ?? `Level ${numeric}`;
    }
    return trimmed;
  }
  return undefined;
}

function matchesSeverity(entrySeverity?: string, filter?: string) {
  if (!filter || filter.toLowerCase() === 'all') return true;
  if (!entrySeverity) return false;
  return entrySeverity.toLowerCase().includes(filter.toLowerCase());
}

function matchesSearch(entry: DashboardLogEntry, search?: string) {
  if (!search) return true;
  const needle = search.toLowerCase();
  return (
    entry.message.toLowerCase().includes(needle) ||
    entry.operationName?.toLowerCase().includes(needle) ||
    entry.category?.toLowerCase().includes(needle)
  );
}

export async function loadDashboardLogs(dashboard: Dashboard, options: LogOptions = {}): Promise<DashboardLogsState> {
  if (dashboard.panelType !== 'logs') {
    return { status: 'disabled', reason: 'Panel is not configured as a log viewer.' };
  }

  if (!dashboard.kqlQuery) {
    return { status: 'disabled', reason: 'No KQL query configured yet.' };
  }

  try {
    const result = await runLogAnalyticsQuery(dashboard.kqlQuery);
    const table = result.tables[0];
    if (!table || table.rows.length === 0) {
      return { status: 'empty', reason: 'Query returned no records.' };
    }

    const timestampIndex = table.columns.findIndex(
      (column) => column.type === 'datetime' || column.name.toLowerCase().includes('timestamp'),
    );
    if (timestampIndex === -1) {
      return { status: 'empty', reason: 'Query results missing timestamp column.' };
    }

    let messageIndex = table.columns.findIndex((column) => column.name.toLowerCase().includes('message'));
    if (messageIndex === -1) {
      messageIndex = table.columns.findIndex((column, index) => index !== timestampIndex && TEXT_COLUMN_TYPES.has(column.type));
    }
    if (messageIndex === -1) {
      return { status: 'empty', reason: 'Query results missing message column.' };
    }

    const severityIndex = table.columns.findIndex((column) => column.name.toLowerCase().includes('severity'));
    const operationIndex = table.columns.findIndex((column) => column.name.toLowerCase().includes('operation'));
    const categoryIndex = table.columns.findIndex((column) => column.name.toLowerCase().includes('category'));

    const rawEntries: DashboardLogEntry[] = table.rows.flatMap((row, index) => {
      const rawTimestamp = row[timestampIndex];
      if (!rawTimestamp) {
        return [];
      }
      const date = new Date(rawTimestamp as string);
      if (Number.isNaN(date.getTime())) {
        return [];
      }
      const message = row[messageIndex];
      if (typeof message !== 'string') {
        return [];
      }

      const severity = severityIndex >= 0 ? normalizeSeverity(row[severityIndex]) : undefined;
      const operationName =
        operationIndex >= 0 && typeof row[operationIndex] === 'string' ? (row[operationIndex] as string) : undefined;
      const category =
        categoryIndex >= 0 && typeof row[categoryIndex] === 'string' ? (row[categoryIndex] as string) : undefined;

      return [
        {
          id: `${date.toISOString()}-${index}`,
          timestamp: date.toISOString(),
          message: message.trim(),
          severity,
          operationName,
          category,
        },
      ];
    });

    if (rawEntries.length === 0) {
      return { status: 'empty', reason: 'Query returned no parsable log entries.' };
    }

    const normalizedSearch = options.search?.trim().toLowerCase();
    const normalizedSeverity = options.severity?.trim();
    const limit = Math.min(Math.max(options.limit ?? 100, 1), 500);

    const filteredEntries = rawEntries.filter(
      (entry) => matchesSeverity(entry.severity, normalizedSeverity) && matchesSearch(entry, normalizedSearch),
    );

    if (filteredEntries.length === 0) {
      return { status: 'empty', reason: 'No log entries matched the current filters.' };
    }

    return {
      status: 'success',
      entries: filteredEntries.slice(0, limit),
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error while running query.';
    return { status: 'error', message };
  }
}
