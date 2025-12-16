import { requireAdminSession } from '@/lib/adminSession';
import { PostForm } from '@/app/(admin)/components/post-form';
import { createPostAction } from '../posts/actions';

export const dynamic = 'force-dynamic';

export default async function ComposePage() {
  await requireAdminSession();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-widest text-indigo-500">Posts</p>
        <h1 className="text-3xl font-bold">Compose New Post</h1>
        <p className="mt-2 text-sm text-gray-500">Write Markdown posts with tags, publish dates, and featured images.</p>
      </div>
      <PostForm upsertAction={createPostAction} mode="create" />
    </div>
  );
}
