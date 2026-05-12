import Link from 'next/link';
import type { Metadata } from 'next';
import { getAppsForAdmin } from '@/lib/apps';
import { ContentDate } from '@/components/content-date';
import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/surface';
import { AdminSectionHeader } from '@/app/(admin)/components/admin-section-header';
import { runAdminPage } from '@/lib/adminPageHelpers';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Manage apps • Admin',
};

export default async function AdminAppsPage() {
  return runAdminPage(async () => {
    const apps = await getAppsForAdmin();

    return (
      <div className="space-y-6">
        <AdminSectionHeader
          label="Apps"
          title="Manage app listings"
          description="Keep app metadata and release notes current."
          action={
            <Button asChild size="lg">
              <Link href="/admin/apps/new">New app</Link>
            </Button>
          }
        />
        <Surface
          className="rounded-2xl shadow-[0_20px_45px_rgba(6,10,20,0.35)]"
          innerClassName="overflow-hidden rounded-2xl border border-border/60 bg-card"
        >
          <table className="min-w-full divide-y divide-border/60 text-sm">
            <caption className="sr-only">Apps list</caption>
            <thead className="bg-background/80 text-left">
              <tr>
                <th scope="col" className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Name</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Version</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Published</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {apps.map((app) => (
                <tr key={app.slug} className="hover:bg-background/40">
                  <td className="px-6 py-4 font-medium text-foreground">{app.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{app.version}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    <ContentDate value={app.publishDate} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3 text-sm">
                      <Link href={`/apps/${app.slug}`} target="_blank" className="inline-block rounded px-3 py-2 font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        View
                        <span className="sr-only"> (opens in new tab)</span>
                      </Link>
                      <Link href={`/admin/apps/${app.slug}/edit`} className="inline-block rounded px-3 py-2 font-semibold text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {apps.length === 0 && <p className="px-6 py-10 text-center text-sm text-muted-foreground">No apps published yet.</p>}
        </Surface>
      </div>
    );
  });
}
