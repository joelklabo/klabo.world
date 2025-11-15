import { requireAdminSession } from '@/lib/adminSession';
import { ImageUploadField } from '@/app/(admin)/components/image-upload-field';
import { MarkdownField } from '@/app/(admin)/components/markdown-field';
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
      <form action={createPostAction} className="space-y-6" data-testid="compose-post-form">
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. Agentically Engineering Past Procrastination"
            data-testid="compose-title"
          />
        </div>
        <div>
          <label htmlFor="summary" className="block text-sm font-semibold text-gray-700">
            Summary
          </label>
          <textarea
            id="summary"
            name="summary"
            required
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            data-testid="compose-summary"
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
              placeholder="bitcoin, lightning"
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              data-testid="compose-tags"
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
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              data-testid="compose-publish-date"
            />
            <p className="mt-1 text-xs text-gray-500">Leave blank to publish immediately.</p>
          </div>
        </div>
        <ImageUploadField
          name="featuredImage"
          label="Featured image path"
          placeholder="/uploads/hero.png"
          helperText="Upload new images or paste any existing /images path."
          tone="indigo"
          inputTestId="compose-featured-image"
          uploadButtonTestId="compose-image-upload"
        />
        <MarkdownField
          name="content"
          label="Content (Markdown)"
          helperText="Supports MDX + GitHub-flavored markdown. Use the preview to verify formatting."
          tone="indigo"
          textareaTestId="compose-content"
        />
        <div className="flex justify-end gap-3">
          <button
            type="reset"
            className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-600 hover:border-gray-400"
            data-testid="compose-reset"
          >
            Reset
          </button>
          <button
            type="submit"
            className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            data-testid="compose-submit"
          >
            Publish post
          </button>
        </div>
      </form>
    </div>
  );
}
