import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DashboardForm } from '@/app/(admin)/components/dashboard-form';
import { DashboardChart } from '@/app/(admin)/components/dashboard-chart';
import { DashboardLogsPanel } from '@/app/(admin)/components/dashboard-logs-panel';
import { deleteDashboardAction, updateDashboardAction } from '../actions';
import { getDashboardBySlug } from '@/lib/dashboards';
import { loadDashboardChartState } from '@/lib/dashboardCharts';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: { slug: string };
};

export default async function DashboardDetailPage({ params }: PageProps) {
  const dashboard = getDashboardBySlug(params.slug);
  if (!dashboard) {
    notFound();
  }
  const isChartPanel = dashboard.panelType === 'chart';
  const isLogsPanel = dashboard.panelType === 'logs';
  const chartState = isChartPanel ? await loadDashboardChartState(dashboard) : null;
  const showChartPreview = Boolean(chartState && chartState.status !== 'disabled');
  const showPanelPreview = showChartPreview || isLogsPanel;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-indigo-500">Dashboard</p>
          <h1 className="text-3xl font-bold">{dashboard.title}</h1>
          <p className="text-sm text-gray-500">{dashboard.summary}</p>
        </div>
        <Link href="/admin/dashboards" className="text-sm font-semibold text-gray-500 hover:text-gray-700">
          ← Back to dashboards
        </Link>
      </div>

      {showPanelPreview && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-widest text-indigo-500">Panel preview</p>
              <h2 className="text-2xl font-semibold">{dashboard.title}</h2>
              {chartState?.status === 'success' && (
                <p className="text-xs text-gray-500">Last refreshed {new Date(chartState.refreshedAt).toUTCString()}</p>
              )}
            </div>
            {dashboard.refreshIntervalSeconds && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                Refreshes ~ every {dashboard.refreshIntervalSeconds}s
              </span>
            )}
          </div>

          <div className="mt-6">
            {showChartPreview && chartState ? (
              chartState.status === 'success' ? (
                <DashboardChart data={chartState.points} chartType={dashboard.chartType} valueLabel={chartState.valueLabel} />
              ) : chartState.status === 'error' ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Unable to load chart data: {chartState.message}
                </div>
              ) : chartState.status === 'empty' ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
                  {chartState.reason}
                </div>
              ) : (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-6 text-center text-sm text-yellow-700">
                  Panel preview unavailable.
                </div>
              )
            ) : isLogsPanel ? (
              <DashboardLogsPanel dashboardSlug={dashboard.slug} refreshIntervalSeconds={dashboard.refreshIntervalSeconds} />
            ) : (
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-6 text-center text-sm text-yellow-700">
                Panel preview unavailable.
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold">Configuration</h2>
          <p className="text-sm text-gray-500">Update metadata, KQL queries, or embed links.</p>
          <div className="mt-6">
            <DashboardForm action={updateDashboardAction} dashboard={dashboard} includeSlugField submitLabel="Save changes" />
          </div>
          <form
            action={deleteDashboardAction}
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30"
          >
            <input type="hidden" name="slug" value={dashboard.slug} />
            <p className="mb-3 font-semibold">Danger zone</p>
            <p className="mb-4 text-red-500">Deleting a dashboard removes it from Contentlayer and GitHub. This cannot be undone.</p>
            <button type="submit" className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100">
              Delete dashboard
            </button>
          </form>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500">Metadata</h3>
            <dl className="mt-4 space-y-3 text-sm text-gray-700">
              <div>
                <dt className="font-semibold text-gray-900">Slug</dt>
                <dd className="text-gray-600">{dashboard.slug}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-900">Panel type</dt>
                <dd className="text-gray-600 capitalize">{dashboard.panelType ?? 'chart'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-900">Tags</dt>
                <dd className="flex flex-wrap gap-2">
                  {dashboard.tags?.map((tag) => (
                    <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                      {tag}
                    </span>
                  )) ?? <span className="text-xs text-gray-400">—</span>}
                </dd>
              </div>
              {dashboard.externalUrl && (
                <div>
                  <dt className="font-semibold text-gray-900">External link</dt>
                  <dd>
                    <a href={dashboard.externalUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-500">
                      {dashboard.externalUrl}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
          {dashboard.iframeUrl && (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <iframe src={dashboard.iframeUrl} title={dashboard.title} className="h-72 w-full rounded-2xl" />
            </div>
          )}
          {dashboard.kqlQuery && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-500">KQL query</h3>
              <pre className="overflow-x-auto rounded-xl bg-gray-900 p-3 text-xs text-gray-100">
                <code>{dashboard.kqlQuery}</code>
              </pre>
            </div>
          )}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-500">Notes</h3>
            <article className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">{dashboard.body?.raw ?? 'No notes yet.'}</article>
          </div>
        </div>
      </div>
    </div>
  );
}
