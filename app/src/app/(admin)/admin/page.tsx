import Link from 'next/link';
import type { Route } from 'next';
import { LoginForm } from '../login-form';
import { getPostsForAdmin } from '@/lib/posts';
import { ContentDate } from '@/components/content-date';
import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/surface';
import { getAdminSession } from '@/lib/adminSession';
import { AdminSectionHeader } from '@/app/(admin)/components/admin-section-header';
import { AdminActionLink } from '@/app/(admin)/components/admin-action-link';

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
          <Button asChild size="lg">
            <Link href={'/admin/compose' as Route}>Compose post</Link>
          </Button>
        }
      />
      <Surface
        className="rounded-2xl shadow-[0_20px_45px_rgba(6,10,20,0.35)]"
        innerClassName="overflow-hidden rounded-2xl border border-border/60 bg-card"
      >
        <table className="min-w-full divide-y divide-border/60 text-sm">
          <caption className="sr-only">Posts list</caption>
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
                    <AdminActionLink href={`/posts/${post.slug}` as Route} target="_blank">
                      View
                      <span className="sr-only"> (opens in new tab)</span>
                    </AdminActionLink>
                    <AdminActionLink href={`/admin/posts/${post.slug}/edit` as Route} variant="primary">
                      Edit
                    </AdminActionLink>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && <p className="px-6 py-10 text-center text-sm text-muted-foreground">No posts yet.</p>}
      </Surface>
    </div>
  );
}
