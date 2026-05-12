import { LoginForm } from '../login-form';
import { getPostsForAdmin } from '@/lib/posts';
import { ContentDate } from '@/components/content-date';
import { getAdminSession } from '@/lib/adminSession';
import { AdminSectionHeader } from '@/app/(admin)/components/admin-section-header';
import { AdminActionLink } from '@/app/(admin)/components/admin-action-link';
import { AdminActionButton } from '@/app/(admin)/components/admin-action-button';
import { AdminListTable } from '@/app/(admin)/components/admin-list-table';

export const dynamic = 'force-dynamic';

type AdminSearchParams = {
  error?: string;
};

export default async function AdminLanding({ searchParams }: { searchParams?: AdminSearchParams | Promise<AdminSearchParams> }) {
  const session = await getAdminSession();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const posts = session?.user ? await getPostsForAdmin() : [];

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md py-16">
        <h1 className="mb-6 text-3xl font-semibold">Admin Login</h1>
        <LoginForm key={`login-${resolvedSearchParams?.error ?? 'none'}`} initialError={resolvedSearchParams?.error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        label="Dashboard"
        title="Content overview"
        description="Publish and maintain posts."
        action={
          <AdminActionButton href="/admin/compose">Compose post</AdminActionButton>
        }
      />
      <AdminListTable
        caption="Posts list"
        emptyState={posts.length === 0 ? <p className="px-6 py-10 text-center text-sm text-muted-foreground">No posts yet.</p> : null}
      >
        <thead className="bg-background/80 text-left">
          <tr>
            <th scope="col" className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Title</th>
            <th scope="col" className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Publish date</th>
            <th scope="col" className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Tags</th>
            <th scope="col" className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {posts.map((post) => (
            <tr key={post.slug} className="hover:bg-background/40">
              <td className="px-6 py-4 font-medium text-foreground">{post.title}</td>
              <td className="px-6 py-4 text-muted-foreground">
                <ContentDate value={post.publishDate} fallback={post.date} />
              </td>
              <td className="px-6 py-4 text-muted-foreground">{post.tags?.length ? post.tags.join(', ') : '—'}</td>
              <td className="px-6 py-4 text-sm">
                <div className="flex gap-3">
                  <AdminActionLink href={`/posts/${post.slug}`} target="_blank">
                    View
                    <span className="sr-only"> (opens in new tab)</span>
                  </AdminActionLink>
                  <AdminActionLink href={`/admin/posts/${post.slug}/edit`} variant="primary">
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
}
