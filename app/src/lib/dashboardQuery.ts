import { type Dashboard } from './dashboards';
import { hasAnalyticsConfig } from './logAnalytics';

const analyticsMissingMessage =
  'Log Analytics not configured (set LOG_ANALYTICS_* or APPINSIGHTS_* env vars).';

type PanelState =
  | { kind: 'ready'; query: string }
  | { kind: 'disabled'; reason: string };

export function getPanelState(
  dashboard: Dashboard,
  panelType: 'chart' | 'logs',
  notPanelMessage: string,
): PanelState {
  if (dashboard.panelType !== panelType) {
    return { kind: 'disabled', reason: notPanelMessage };
  }

  if (!dashboard.kqlQuery) {
    return { kind: 'disabled', reason: 'No KQL query configured yet.' };
  }

  if (!hasAnalyticsConfig()) {
    return { kind: 'disabled', reason: analyticsMissingMessage };
  }

  return { kind: 'ready', query: dashboard.kqlQuery };
}
