import type { Metadata } from 'next';
import { getAppsForAdmin } from '@/lib/apps';
import { ContentDate } from '@/components/content-date';
import { AdminSectionHeader } from '@/app/(admin)/components/admin-section-header';
import { AdminActionLink } from '@/app/(admin)/components/admin-action-link';
import { AdminActionButton } from '@/app/(admin)/components/admin-action-button';
import { AdminListTable } from '@/app/(admin)/components/admin-list-table';
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
            <AdminActionButton href="/admin/apps/new">New app</AdminActionButton>
          }
        />
        <AdminListTable
          caption="Apps list"
          emptyState={apps.length === 0 ? <p className="px-6 py-10 text-center text-sm text-muted-foreground">No apps published yet.</p> : null}
        >
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
                    <AdminActionLink href={`/apps/${app.slug}`} target="_blank">
                      View
                      <span className="sr-only"> (opens in new tab)</span>
                    </AdminActionLink>
                    <AdminActionLink href={`/admin/apps/${app.slug}/edit`} variant="primary">
                      Edit
                    </AdminActionLink>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminListTable>
      </div>
    );
  });
}
