import { PostForm } from '@/app/(admin)/components/post-form';
import { AdminSectionHeader } from '@/app/(admin)/components/admin-section-header';
import { createPostAction } from '../posts/actions';
import { runAdminPage } from '@/lib/adminPageHelpers';

export const dynamic = 'force-dynamic';

export default async function ComposePage() {
  return runAdminPage(async () => (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <AdminSectionHeader
        label="Posts"
        title="Compose New Post"
        description="Write Markdown posts with tags, publish dates, and featured images."
      />
      <PostForm upsertAction={createPostAction} mode="create" />
    </div>
  ));
}
