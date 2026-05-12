import { type Dashboard } from './dashboards';
import { hasAnalyticsConfig } from './logAnalytics';

const analyticsMissingMessage =
  'Log Analytics not configured (set LOG_ANALYTICS_* or APPINSIGHTS_* env vars).';

type PanelState =
  | { status: 'ready'; query: string }
  | { status: 'disabled'; reason: string };

export function getPanelState(
  dashboard: Dashboard,
  panelType: 'chart' | 'logs',
  notPanelMessage: string,
): PanelState {
  if (dashboard.panelType !== panelType) {
    return { status: 'disabled', reason: notPanelMessage };
  }

  if (!dashboard.kqlQuery) {
    return { status: 'disabled', reason: 'No KQL query configured yet.' };
  }

  if (!hasAnalyticsConfig()) {
    return { status: 'disabled', reason: analyticsMissingMessage };
  }

  return { status: 'ready', query: dashboard.kqlQuery };
}
