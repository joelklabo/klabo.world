import Link from 'next/link';
import type { Metadata } from 'next';
import { getEditablePostBySlug } from '@/lib/posts';
import { PostForm } from '@/app/(admin)/components/post-form';
import { AdminSectionHeader } from '@/app/(admin)/components/admin-section-header';
import { updatePostAction, deletePostAction } from '../../actions';
import { runAdminSlugPage, runAdminSlugMetadata } from '@/lib/adminPageHelpers';

type Params = { slug: string };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  return runAdminSlugMetadata(
    params,
    getEditablePostBySlug,
    (post) => ({ title: `Edit ${post.title} • Admin` }),
    () => ({ title: 'Post not found • Admin' }),
  );
}

export default async function EditPostPage({ params }: { params: Promise<Params> }) {
  return runAdminSlugPage(params, getEditablePostBySlug, (post) => (
    <div className="mx-auto max-w-4xl space-y-6">
      <AdminSectionHeader
        label="Posts"
        title="Edit post"
        action={
          <Link
            href="/admin"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            ← Back to dashboard
          </Link>
        }
      />
      <PostForm
        upsertAction={updatePostAction}
        deleteAction={deletePostAction}
        initialData={post}
        mode="edit"
      />
    </div>
  ));
}
