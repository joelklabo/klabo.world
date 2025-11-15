import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPostBySlug, getPosts } from '@/lib/posts';
import { updatePostAction, deletePostAction } from '../../actions';

type Params = { slug: string };

export const dynamic = 'force-dynamic';

export function generateStaticParams(): Params[] {
  return getPosts({ includeUnpublished: true }).map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const post = getPostBySlug(params.slug);
  if (!post) {
    return { title: 'Post not found • Admin' };
  }
  return { title: `Edit ${post.title} • Admin` };
}

export default function EditPostPage({ params }: { params: Params }) {
  const post = getPostBySlug(params.slug);
  if (!post) {
    notFound();
  }

  const updateAction = updatePostAction.bind(null, post.slug);
  const deleteAction = deletePostAction.bind(null, post.slug);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-indigo-500">Posts</p>
          <h1 className="text-3xl font-bold">Edit post</h1>
        </div>
        <Link href="/admin" className="text-sm font-semibold text-gray-500 hover:text-gray-700">
          ← Back to dashboard
        </Link>
      </div>
      <form action={updateAction} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={post.title}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="summary" className="block text-sm font-semibold text-gray-700">
            Summary
          </label>
          <textarea
            id="summary"
            name="summary"
            rows={3}
            defaultValue={post.summary}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="tags" className="block text-sm font-semibold text-gray-700">
              Tags (comma-separated)
            </label>
            <input
              id="tags"
              name="tags"
              type="text"
              defaultValue={post.tags?.join(', ')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="publishDate" className="block text-sm font-semibold text-gray-700">
              Publish date
            </label>
            <input
              id="publishDate"
              name="publishDate"
              type="date"
              defaultValue={(post.publishDate ?? post.date).slice(0, 10)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div>
          <label htmlFor="featuredImage" className="block text-sm font-semibold text-gray-700">
            Featured image path
          </label>
          <input
            id="featuredImage"
            name="featuredImage"
            type="text"
            defaultValue={post.featuredImage ?? ''}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-semibold text-gray-700">
            Content (Markdown)
          </label>
          <textarea
            id="content"
            name="content"
            rows={18}
            defaultValue={post.body.raw}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex justify-between">
          <form action={deleteAction}>
            <button type="submit" className="rounded-full border border-red-200 px-5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
              Delete
            </button>
          </form>
          <button type="submit" className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
