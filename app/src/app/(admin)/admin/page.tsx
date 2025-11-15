import Link from 'next/link';
import type { Route } from 'next';
import { auth } from '@/lib/nextAuth';
import { LoginForm } from '../login-form';
import { getPostsForAdmin } from '@/lib/posts';

export const dynamic = 'force-dynamic';

type AdminSearchParams = {
  error?: string;
};

export default async function AdminLanding({ searchParams }: { searchParams?: AdminSearchParams | Promise<AdminSearchParams> }) {
  const session = await auth();
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams as AdminSearchParams) : undefined;
  const posts = session?.user ? await getPostsForAdmin() : [];

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="mb-6 text-3xl font-semibold">Admin Login</h1>
        <LoginForm initialError={resolvedSearchParams?.error} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-indigo-500">Dashboard</p>
          <h1 className="text-3xl font-bold">Content overview</h1>
        </div>
        <Link href={'/admin/compose' as Route} className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
          Compose post
        </Link>
      </div>
      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-800 dark:text-gray-300">
            <tr>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Publish date</th>
              <th className="px-6 py-3">Tags</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {posts.map((post) => (
              <tr key={post.slug} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{post.title}</td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                  {new Date(post.publishDate ?? post.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{post.tags?.length ? post.tags.join(', ') : '—'}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-3">
                    <Link href={`/posts/${post.slug}` as Route} target="_blank" className="text-indigo-600 hover:text-indigo-400">
                      View
                    </Link>
                    <Link href={`/admin/posts/${post.slug}/edit` as Route} className="text-emerald-600 hover:text-emerald-400">
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && <p className="px-6 py-10 text-center text-sm text-gray-500">No posts yet.</p>}
      </div>
    </div>
  );
}
