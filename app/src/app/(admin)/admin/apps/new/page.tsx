import Link from 'next/link';
import type { Metadata } from 'next';
import { AppForm } from '@/app/(admin)/components/app-form';
import { AdminSectionHeader } from '@/app/(admin)/components/admin-section-header';
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
        mode="create"
      />
    </div>
  ));
}
