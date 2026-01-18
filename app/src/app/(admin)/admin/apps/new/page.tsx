import Link from 'next/link';
import type { Metadata } from 'next';
import { requireAdminSession } from '@/lib/adminSession';
import { AppForm } from '@/app/(admin)/components/app-form';
import { upsertAppAction } from '../[slug]/actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'New app • Admin',
};

export default async function NewAppPage() {
  await requireAdminSession();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-purple-500">Apps</p>
          <h1 className="text-3xl font-bold">Create app listing</h1>
          <p className="mt-2 text-sm text-gray-500">Provide metadata, features, and screenshots for the apps page.</p>
        </div>
        <Link href="/admin/apps" className="text-sm font-semibold text-gray-500 hover:text-gray-700 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
          ← Back to apps
        </Link>
      </div>
      <AppForm
        upsertAction={upsertAppAction}
        mode="create"
      />
    </div>
  );
}
