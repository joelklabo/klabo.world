import type { Metadata } from 'next';
import { AppForm } from '@/app/(admin)/components/app-form';
import { AdminSectionHeader } from '@/app/(admin)/components/admin-section-header';
import { AdminBackLink } from '@/app/(admin)/components/admin-back-link';
import { upsertAppAction } from '../[slug]/actions';
import { runAdminPage } from '@/lib/adminPageHelpers';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'New app • Admin',
};

export default async function NewAppPage() {
  return runAdminPage(async () => (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <AdminSectionHeader
        label="Apps"
        title="Create app listing"
        description="Provide metadata, features, and screenshots for the apps page."
        action={
          <AdminBackLink
            href="/admin/apps"
          >
            ← Back to apps
          </AdminBackLink>
        }
      />
      <AppForm
        upsertAction={upsertAppAction}
        mode="create"
      />
    </div>
  ));
}
