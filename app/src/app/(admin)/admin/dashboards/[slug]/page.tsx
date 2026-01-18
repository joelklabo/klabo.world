import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardForm } from "@/app/(admin)/components/dashboard-form";
import { DashboardChart } from "@/app/(admin)/components/dashboard-chart";
import { DashboardLogsPanel } from "@/app/(admin)/components/dashboard-logs-panel";
import { deleteDashboardAction, updateDashboardAction } from "../actions";
import { getDashboardBySlug } from "@/lib/dashboards";
import { loadDashboardChartState } from "@/lib/dashboardCharts";
import { requireAdminSession } from "@/lib/adminSession";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function getHostname(url?: string | null) {
  if (!url) {
    return "dashboard";
  }
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^https?:\/\//, "");
  }
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DashboardDetailPage({ params }: PageProps) {
  await requireAdminSession();
  const { slug } = await params;
  const dashboard = getDashboardBySlug(slug);
  if (!dashboard) {
    notFound();
  }
  const isChartPanel = dashboard.panelType === "chart";
  const isLogsPanel = dashboard.panelType === "logs";
  const isEmbedPanel = dashboard.panelType === "embed";
  const isLinkPanel = dashboard.panelType === "link";
  const chartState = isChartPanel
    ? await loadDashboardChartState(dashboard)
    : null;
  const showChartPreview = Boolean(
    chartState && chartState.status !== "disabled",
  );
  const embedUrl = isEmbedPanel ? dashboard.iframeUrl : null;
  const linkUrl = isLinkPanel ? dashboard.externalUrl : null;
  const showPanelPreview =
    showChartPreview || isLogsPanel || Boolean(embedUrl) || Boolean(linkUrl);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Dashboard</p>
          <h1 className="text-3xl font-bold text-foreground" data-testid="dashboard-title">
            {dashboard.title}
          </h1>
          <p
            className="text-sm text-muted-foreground"
            data-testid="dashboard-summary-text"
          >
            {dashboard.summary}
          </p>
        </div>
        <Link
          href="/admin/dashboards"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          ← Back to dashboards
        </Link>
      </div>

      {showPanelPreview && (
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-[0_20px_45px_rgba(6,10,20,0.35)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Panel preview</p>
              <h2 className="text-2xl font-semibold text-foreground">{dashboard.title}</h2>
              {chartState?.status === "success" && (
                <p className="text-xs text-muted-foreground">
                  Last refreshed{" "}
                  <time dateTime={new Date(chartState.refreshedAt).toISOString()}>
                    {new Date(chartState.refreshedAt).toUTCString()}
                  </time>
                </p>
              )}
            </div>
            {dashboard.refreshIntervalSeconds && (
              <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
                Refreshes ~ every {dashboard.refreshIntervalSeconds}s
              </span>
            )}
          </div>

          <div className="mt-6">
            {showChartPreview && chartState ? (
              chartState.status === "success" ? (
                <DashboardChart
                  data={chartState.points}
                  chartType={dashboard.chartType}
                  valueLabel={chartState.valueLabel}
                />
              ) : chartState.status === "error" ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Unable to load chart data: {chartState.message}
                </div>
              ) : chartState.status === "empty" ? (
                <div className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
                  {chartState.reason}
                </div>
              ) : (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-6 text-center text-sm text-yellow-700">
                  Panel preview unavailable.
                </div>
              )
            ) : isLogsPanel ? (
              <DashboardLogsPanel
                dashboardSlug={dashboard.slug}
                refreshIntervalSeconds={dashboard.refreshIntervalSeconds}
              />
            ) : embedUrl ? (
              <div className="space-y-4">
                <iframe
                  src={embedUrl}
                  title={dashboard.title}
                  className="h-[420px] w-full rounded-2xl border border-border/60"
                  allowFullScreen
                />
                <p className="text-xs text-muted-foreground">
                  Embedded iframe. Update the URL or switch panel types below if
                  you need to point at a different dashboard.
                </p>
              </div>
            ) : linkUrl ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-6 text-sm text-foreground">
                <p className="font-semibold text-foreground">External dashboard</p>
                <p className="mt-2 text-muted-foreground">
                  This panel renders as a CTA button that opens the dashboard in
                  a new tab.
                </p>
                <Button asChild size="xs" className="mt-4">
                  <a href={linkUrl} target="_blank" rel="noreferrer">
                    Open {getHostname(linkUrl)}
                    <span className="sr-only"> (opens in new tab)</span>
                  </a>
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-6 text-center text-sm text-yellow-700">
                Panel preview unavailable.
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-[0_20px_45px_rgba(6,10,20,0.35)] lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Configuration</h2>
          <p className="text-sm text-muted-foreground">Update metadata, KQL queries, or embed links.</p>
          <div className="mt-6">
            <DashboardForm
              action={updateDashboardAction}
              dashboard={dashboard}
              includeSlugField
              submitLabel="Save changes"
            />
          </div>
          <form
            action={deleteDashboardAction}
            className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          >
            <input type="hidden" name="slug" value={dashboard.slug} />
            <p className="mb-3 font-semibold">Danger zone</p>
            <p className="mb-4 text-destructive/80">
              Deleting a dashboard removes it from Contentlayer and GitHub. This
              cannot be undone.
            </p>
            <Button type="submit" variant="destructive-outline" size="xs">
              Delete dashboard
            </Button>
          </form>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[0_20px_45px_rgba(6,10,20,0.35)]">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Metadata</h3>
            <dl className="mt-4 space-y-3 text-sm text-muted-foreground">
              <div>
                <dt className="font-semibold text-foreground">Slug</dt>
                <dd>{dashboard.slug}</dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">Panel type</dt>
                <dd className="capitalize">{dashboard.panelType ?? "chart"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">Tags</dt>
                <dd className="flex flex-wrap gap-2">
                  {dashboard.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {tag}
                    </span>
                  )) ?? <span className="text-xs text-muted-foreground">—</span>}
                </dd>
              </div>
              {dashboard.externalUrl && (
                <div>
                  <dt className="font-semibold text-foreground">External link</dt>
                  <dd>
                    <a
                      href={dashboard.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:text-primary/80 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      {dashboard.externalUrl}
                      <span className="sr-only"> (opens in new tab)</span>
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
          {dashboard.iframeUrl && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-[0_20px_45px_rgba(6,10,20,0.35)]">
              <iframe
                src={dashboard.iframeUrl}
                title={dashboard.title}
                className="h-72 w-full rounded-2xl"
              />
            </div>
          )}
          {dashboard.kqlQuery && (
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[0_20px_45px_rgba(6,10,20,0.35)]">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">KQL query</h3>
              <pre className="overflow-x-auto rounded-xl bg-gray-900 p-3 text-xs text-gray-100">
                <code>{dashboard.kqlQuery}</code>
              </pre>
            </div>
          )}
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[0_20px_45px_rgba(6,10,20,0.35)]">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Notes</h3>
            <article className="prose prose-sm max-w-none whitespace-pre-wrap text-muted-foreground dark:prose-invert">
              {dashboard.body?.raw ?? "No notes yet."}
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
