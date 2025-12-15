import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getEditablePostBySlug } from '@/lib/posts';
import { PostForm } from '@/app/(admin)/components/post-form';
import { updatePostAction, deletePostAction } from '../../actions';

type Params = { slug: string };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getEditablePostBySlug(slug);
  if (!post) {
    return { title: 'Post not found • Admin' };
  }
  return { title: `Edit ${post.title} • Admin` };
}

export default async function EditPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await getEditablePostBySlug(slug);
  if (!post) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Posts</p>
          <h1 className="text-3xl font-bold text-foreground">Edit post</h1>
        </div>
        <Link href="/admin" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
          ← Back to dashboard
        </Link>
      </div>
      <PostForm
        upsertAction={updatePostAction}
        deleteAction={deletePostAction}
        initialData={post}
        mode="edit"
      />
    </div>
  );
}
