import Link from 'next/link';
import { getDashboards } from '@/lib/dashboards';

export const dynamic = 'force-dynamic';

export default function AdminDashboardsPage() {
  const dashboards = getDashboards();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-indigo-500">Dashboards</p>
          <h1 className="text-3xl font-bold">Monitor klabo.world</h1>
          <p className="text-sm text-gray-500">Track telemetry, logs, and runbooks inside the admin portal.</p>
        </div>
        <Link
          href="/admin/dashboards/new"
          className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          + New dashboard
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Tags</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {dashboards.map((dashboard) => (
              <tr key={dashboard.slug}>
                <td className="px-4 py-4">
                  <div className="font-semibold text-gray-900">{dashboard.title}</div>
                  <div className="text-sm text-gray-500">{dashboard.summary}</div>
                </td>
                <td className="px-4 py-4 text-sm capitalize text-gray-600">{dashboard.panelType ?? 'chart'}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {dashboard.tags?.map((tag) => (
                      <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                        {tag}
                      </span>
                    )) ?? <span className="text-xs text-gray-400">—</span>}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm">
                  <Link href={`/admin/dashboards/${dashboard.slug}`} className="font-semibold text-indigo-600 hover:text-indigo-500">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {dashboards.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500">
                  No dashboards defined yet. Create one to link App Insights, Grafana, or runbook notes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
