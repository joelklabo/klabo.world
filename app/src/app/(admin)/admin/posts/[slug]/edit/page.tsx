import type { Metadata } from 'next';
import { getEditablePostBySlug } from '@/lib/posts';
import { PostForm } from '@/app/(admin)/components/post-form';
import { AdminSectionHeader } from '@/app/(admin)/components/admin-section-header';
import { AdminBackLink } from '@/app/(admin)/components/admin-back-link';
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
          <AdminBackLink
            href="/admin"
          >
            ← Back to dashboard
          </AdminBackLink>
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
