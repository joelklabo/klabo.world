import Link from "next/link";
import { getDashboards } from "@/lib/dashboards";
import { requireAdminSession } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

export default async function AdminDashboardsPage() {
  await requireAdminSession();
  const dashboards = getDashboards();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Dashboards
          </p>
          <h1 className="text-3xl font-bold text-foreground">
            Monitor klabo.world
          </h1>
          <p className="text-sm text-muted-foreground">
            Track telemetry, logs, and runbooks inside the admin portal.
          </p>
        </div>
        <Link
          href="/admin/dashboards/new"
          className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition hover:-translate-y-0.5 hover:shadow-primary/40"
        >
          + New dashboard
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_20px_45px_rgba(6,10,20,0.35)]">
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
      </div>
    </div>
  );
}
