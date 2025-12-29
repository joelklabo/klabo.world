'use client';

import { useOptimistic } from 'react';
import Link from 'next/link';
import { type Dashboard } from '@/lib/dashboards';
import { Surface } from '@/components/ui/surface';

type DashboardListProps = {
  initialDashboards: Dashboard[];
};

export function DashboardList({ initialDashboards }: DashboardListProps) {
  const [dashboards] = useOptimistic(initialDashboards);

  return (
    <Surface
      className="rounded-2xl shadow-[0_20px_45px_rgba(6,10,20,0.35)]"
      innerClassName="overflow-hidden rounded-2xl border border-border/60 bg-card"
    >
      <table className="min-w-full divide-y divide-border/60">
        <thead className="bg-background/80">
          <tr>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Title
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Type
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Tags
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
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
                {dashboard.panelType ?? "chart"}
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
                <Link
                  href={`/admin/dashboards/${dashboard.slug}`}
                  className="font-semibold text-primary hover:text-primary/80"
                >
                  View
                </Link>
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
      </table>
    </Surface>
  );
}
