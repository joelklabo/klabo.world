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
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-purple-500">Apps</p>
          <h1 className="text-3xl font-bold">Manage app listings</h1>
        </div>
        <Button asChild size="lg">
          <Link href="/admin/apps/new">New app</Link>
        </Button>
      </div>
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="min-w-full divide-y divide-gray-100 text-sm dark:divide-gray-800">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-800 dark:text-gray-300">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Version</th>
              <th className="px-6 py-3">Published</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {apps.map((app) => (
              <tr key={app.slug} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{app.name}</td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{app.version}</td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                  {new Date(app.publishDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-3 text-sm">
                    <Link href={`/apps/${app.slug}`} target="_blank" className="text-purple-600 hover:text-purple-400">
                      View
                    </Link>
                    <Link href={`/admin/apps/${app.slug}/edit`} className="text-emerald-600 hover:text-emerald-400">
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {apps.length === 0 && <p className="px-6 py-10 text-center text-sm text-gray-500">No apps published yet.</p>}
      </div>
    </div>
  );
}
