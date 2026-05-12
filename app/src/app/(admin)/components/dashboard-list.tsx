'use client';

import { useOptimistic } from 'react';
import { type Dashboard } from '@/lib/dashboards';
import { DASHBOARD_PANEL_TYPES } from '@/lib/dashboardPanelTypes';
import { AdminActionLink } from '@/app/(admin)/components/admin-action-link';
import { AdminListTable } from '@/app/(admin)/components/admin-list-table';

type DashboardListProps = {
  initialDashboards: Dashboard[];
};

export function DashboardList({ initialDashboards }: DashboardListProps) {
  const [dashboards] = useOptimistic(initialDashboards);

  return (
    <AdminListTable caption="Dashboards list" tableClassName="min-w-full divide-y divide-border/60">
      <thead className="bg-background/80">
        <tr>
          <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Title
          </th>
          <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Type
          </th>
          <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Tags
          </th>
          <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/60 bg-card">
        {dashboards.map((dashboard) => (
          <tr key={dashboard.slug}>
            <td className="px-4 py-4">
              <div className="font-semibold text-foreground">
                {dashboard.title}
              </div>
              <div className="text-sm text-muted-foreground">
                {dashboard.summary}
              </div>
            </td>
            <td className="px-4 py-4 text-sm capitalize text-muted-foreground">
              {dashboard.panelType ?? DASHBOARD_PANEL_TYPES.chart}
            </td>
            <td className="px-4 py-4">
              <div className="flex flex-wrap gap-2">
                {dashboard.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground"
                  >
                    {tag}
                  </span>
                )) ?? <span className="text-xs text-gray-400">—</span>}
              </div>
            </td>
            <td className="px-4 py-4 text-sm">
              <AdminActionLink href={`/admin/dashboards/${dashboard.slug}`} variant="primary">
                View
              </AdminActionLink>
            </td>
          </tr>
        ))}
        {dashboards.length === 0 && (
          <tr>
            <td
              colSpan={4}
              className="px-4 py-10 text-center text-sm text-muted-foreground"
            >
              No dashboards defined yet. Create one to link App Insights,
              Grafana, or runbook notes.
            </td>
          </tr>
        )}
      </tbody>
    </AdminListTable>
  );
}
