import Link from 'next/link';
import type { Metadata } from 'next';
import { requireAdminSession } from '@/lib/adminSession';
import { getAppsForAdmin } from '@/lib/apps';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Manage apps • Admin',
};

export default async function AdminAppsPage() {
  await requireAdminSession();
  const apps = await getAppsForAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Apps</p>
          <h1 className="text-3xl font-bold text-foreground">Manage app listings</h1>
          <p className="text-sm text-muted-foreground">Keep app metadata and release notes current.</p>
        </div>
        <Button asChild size="lg">
          <Link href="/admin/apps/new">New app</Link>
        </Button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_20px_45px_rgba(6,10,20,0.35)]">
        <table className="min-w-full divide-y divide-border/60 text-sm">
          <thead className="bg-background/80 text-left">
            <tr>
              <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Name</th>
              <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Version</th>
              <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Published</th>
              <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {apps.map((app) => (
              <tr key={app.slug} className="hover:bg-background/40">
                <td className="px-6 py-4 font-medium text-foreground">{app.name}</td>
                <td className="px-6 py-4 text-muted-foreground">{app.version}</td>
                <td className="px-6 py-4 text-muted-foreground">
                  {new Date(app.publishDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-3 text-sm">
                    <Link href={`/apps/${app.slug}`} target="_blank" className="font-semibold text-muted-foreground hover:text-foreground">
                      View
                    </Link>
                    <Link href={`/admin/apps/${app.slug}/edit`} className="font-semibold text-primary hover:text-primary/80">
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {apps.length === 0 && <p className="px-6 py-10 text-center text-sm text-muted-foreground">No apps published yet.</p>}
      </div>
    </div>
  );
}
