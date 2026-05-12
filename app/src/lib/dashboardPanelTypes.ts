export const DASHBOARD_PANEL_TYPES = {
  chart: 'chart',
  logs: 'logs',
  embed: 'embed',
  link: 'link',
} as const;

export const DASHBOARD_PANEL_TYPE_VALUES = [
  DASHBOARD_PANEL_TYPES.chart,
  DASHBOARD_PANEL_TYPES.logs,
  DASHBOARD_PANEL_TYPES.embed,
  DASHBOARD_PANEL_TYPES.link,
] as const;

export type DashboardPanelType = (typeof DASHBOARD_PANEL_TYPES)[keyof typeof DASHBOARD_PANEL_TYPES];

export type DashboardPanelRequirements = {
  requiresKqlQuery: boolean;
  requiresIFrameUrl: boolean;
  requiresExternalUrl: boolean;
};

export const DASHBOARD_PANEL_REQUIREMENTS: Record<DashboardPanelType, DashboardPanelRequirements> = {
  [DASHBOARD_PANEL_TYPES.chart]: {
    requiresKqlQuery: true,
    requiresIFrameUrl: false,
    requiresExternalUrl: false,
  },
  [DASHBOARD_PANEL_TYPES.logs]: {
    requiresKqlQuery: true,
    requiresIFrameUrl: false,
    requiresExternalUrl: false,
  },
  [DASHBOARD_PANEL_TYPES.embed]: {
    requiresKqlQuery: false,
    requiresIFrameUrl: true,
    requiresExternalUrl: false,
  },
  [DASHBOARD_PANEL_TYPES.link]: {
    requiresKqlQuery: false,
    requiresIFrameUrl: false,
    requiresExternalUrl: true,
  },
};

export const DASHBOARD_PANEL_OPTIONS = [
  {
    value: DASHBOARD_PANEL_TYPES.chart,
    label: 'Chart – render KQL as a line/area/bar chart',
  },
  {
    value: DASHBOARD_PANEL_TYPES.logs,
    label: 'Logs – live feed of warnings/errors (KQL)',
  },
  {
    value: DASHBOARD_PANEL_TYPES.embed,
    label: 'Embed – show an iframe (Grafana, Azure, etc.)',
  },
  {
    value: DASHBOARD_PANEL_TYPES.link,
    label: 'External Link – CTA button to another dashboard',
  },
] as const;

export function isDashboardPanelType(value: string | undefined | null): value is DashboardPanelType {
  return (
    value != null &&
    DASHBOARD_PANEL_TYPE_VALUES.includes(value as DashboardPanelType)
  );
}
