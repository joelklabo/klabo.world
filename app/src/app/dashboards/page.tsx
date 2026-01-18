import Link from 'next/link';
import type { Metadata, Route } from 'next';
import { getDashboards } from '@/lib/dashboards';
import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/surface';

export const metadata: Metadata = {
  title: 'Dashboards',
  description: 'Observability dashboards and operational snapshots.',
};

function isExternal(url?: string | null) {
  return Boolean(url && /^https?:\/\//i.test(url));
}

export default function DashboardsPage() {
  const dashboards = getDashboards();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute -left-20 -top-10 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-secondary/18 blur-3xl" />
      </div>
      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Dashboards</p>
            <h1 className="text-4xl font-bold tracking-tight text-balance">Operational snapshots</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Read-only cards that track key health, traffic, and performance signals.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/dashboards">Manage in admin</Link>
          </Button>
        </header>

        {dashboards.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {dashboards.map((dashboard) => {
              const link = dashboard.externalUrl ?? dashboard.iframeUrl ?? `/admin/dashboards/${dashboard.slug}`;
              const external = isExternal(link);
              return (
                <Surface
                  key={dashboard.slug}
                  className="rounded-3xl shadow-[0_20px_45px_rgba(6,10,20,0.45)]"
                  innerClassName="h-full rounded-3xl border border-border/60 bg-card/80 p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                        {dashboard.panelType ?? 'Dashboard'}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-foreground">{dashboard.title}</h2>
                    </div>
                    <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                      {dashboard.refreshIntervalSeconds ? `${dashboard.refreshIntervalSeconds}s` : 'Manual'}
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">{dashboard.summary}</p>
                  {dashboard.tags && dashboard.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
                      {dashboard.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-5">
                    {external ? (
                      <a
                        className="text-xs font-semibold uppercase tracking-[0.3em] text-primary hover:text-primary/80 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open dashboard →
                        <span className="sr-only"> (opens in new tab)</span>
                      </a>
                    ) : (
                      <Link
                        className="text-xs font-semibold uppercase tracking-[0.3em] text-primary hover:text-primary/80 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        href={link as Route}
                      >
                        View details →
                      </Link>
                    )}
                  </div>
                </Surface>
              );
            })}
          </div>
        ) : (
          <Surface
            className="rounded-3xl shadow-[0_20px_45px_rgba(6,10,20,0.45)]"
            innerClassName="rounded-3xl border border-border/60 bg-card/80 p-6 text-sm text-muted-foreground"
          >
            No dashboards configured yet. Create one in the admin panel to link telemetry views.
          </Surface>
        )}
      </div>
    </div>
  );
}
