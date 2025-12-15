import Link from 'next/link';
import type { Route } from 'next';
import { auth } from '@/lib/nextAuth';
import { LoginForm } from '../login-form';
import { getPostsForAdmin } from '@/lib/posts';
import { Button } from '@/components/ui/button';

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
      <div className="mx-auto max-w-md py-16">
        <h1 className="mb-6 text-3xl font-semibold">Admin Login</h1>
        <LoginForm key={`login-${resolvedSearchParams?.error ?? 'none'}`} initialError={resolvedSearchParams?.error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Dashboard</p>
          <h1 className="text-3xl font-bold text-foreground">Content overview</h1>
          <p className="text-sm text-muted-foreground">Publish and maintain posts.</p>
        </div>
        <Button asChild size="lg">
          <Link href={'/admin/compose' as Route}>Compose post</Link>
        </Button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_20px_45px_rgba(6,10,20,0.35)]">
        <table className="min-w-full divide-y divide-border/60 text-sm">
          <thead className="bg-background/80 text-left">
            <tr>
              <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Title</th>
              <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Publish date</th>
              <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Tags</th>
              <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {posts.map((post) => (
              <tr key={post.slug} className="hover:bg-background/40">
                <td className="px-6 py-4 font-medium text-foreground">{post.title}</td>
                <td className="px-6 py-4 text-muted-foreground">
                  {new Date(post.publishDate ?? post.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-muted-foreground">{post.tags?.length ? post.tags.join(', ') : '—'}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-3">
                    <Link href={`/posts/${post.slug}` as Route} target="_blank" className="font-semibold text-muted-foreground hover:text-foreground">
                      View
                    </Link>
                    <Link href={`/admin/posts/${post.slug}/edit` as Route} className="font-semibold text-primary hover:text-primary/80">
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && <p className="px-6 py-10 text-center text-sm text-muted-foreground">No posts yet.</p>}
      </div>
    </div>
  );
}
