import Link from 'next/link';
import type { Metadata } from 'next';
import { requireAdminSession } from '@/lib/adminSession';
import { getContexts } from '@/lib/contexts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Manage contexts • Admin',
};

export default async function AdminContextsPage() {
  await requireAdminSession();
  const contexts = getContexts({ includeDrafts: true });

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-emerald-500">Contexts</p>
          <h1 className="text-3xl font-bold">AI prompt contexts</h1>
        </div>
        <Link href="/admin/contexts/new" className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
          New context
        </Link>
      </div>
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="min-w-full divide-y divide-gray-100 text-sm dark:divide-gray-800">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-800 dark:text-gray-300">
            <tr>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Updated</th>
              <th className="px-6 py-3">Tags</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {contexts.map((context) => (
              <tr key={context.slug} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{context.title}</td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                  {new Date(context.updatedDate ?? context.createdDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                  {context.tags?.join(', ') || '—'}
                </td>
                <td className="px-6 py-4">
                  {context.isPublished ? (
                    <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Published</span>
                  ) : (
                    <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">Draft</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-3 text-sm">
                    <Link href={`/contexts/${context.slug}`} target="_blank" className="text-emerald-600 hover:text-emerald-400">
                      View
                    </Link>
                    <Link href={`/admin/contexts/${context.slug}/edit`} className="text-emerald-600 hover:text-emerald-400">
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {contexts.length === 0 && <p className="px-6 py-10 text-center text-sm text-gray-500">No contexts defined yet.</p>}
      </div>
    </div>
  );
}
