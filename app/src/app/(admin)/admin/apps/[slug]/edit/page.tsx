import Link from 'next/link';
import type { Metadata } from 'next';
import { getEditableAppBySlug } from '@/lib/apps';
import { AppForm } from '@/app/(admin)/components/app-form';
import { AdminSectionHeader } from '@/app/(admin)/components/admin-section-header';
import { upsertAppAction, deleteAppAction } from '../actions';
import { runAdminSlugPage, runAdminSlugMetadata } from '@/lib/adminPageHelpers';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return runAdminSlugMetadata(
    params,
    getEditableAppBySlug,
    (app) => ({ title: `Edit ${app.name} • Admin`, description: app.fullDescription }),
    () => ({ title: 'App not found • Admin' }),
  );
}

export default async function EditAppPage({ params }: { params: Promise<{ slug: string }> }) {
  return runAdminSlugPage(params, getEditableAppBySlug, (app) => (
    <div className="mx-auto max-w-4xl space-y-6">
      <AdminSectionHeader
        label="Apps"
        title="Edit app"
        action={
          <Link
            href="/admin/apps"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            ← Back to apps
          </Link>
        }
      />
      <AppForm
        upsertAction={upsertAppAction}
        deleteAction={deleteAppAction}
        initialData={app}
        mode="edit"
      />
    </div>
  ));
}
