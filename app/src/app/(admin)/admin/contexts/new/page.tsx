import Link from 'next/link';
import type { Metadata } from 'next';
import { requireAdminSession } from '@/lib/adminSession';
import { MarkdownUploadHelper } from '@/app/(admin)/components/upload-helper';
import { MarkdownField } from '@/app/(admin)/components/markdown-field';
import { upsertContextAction } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'New context • Admin',
};

export default async function NewContextPage() {
  await requireAdminSession();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-emerald-500">Contexts</p>
          <h1 className="text-3xl font-bold">Create AI context</h1>
          <p className="mt-2 text-sm text-gray-500">Author reusable AI agent contexts with tags and publication status.</p>
        </div>
        <Link href="/admin/contexts" className="text-sm font-semibold text-gray-500 hover:text-gray-700">
          ← Back to contexts
        </Link>
      </div>
      <form action={upsertContextAction} className="space-y-6" data-testid="contexts-new-form">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700">
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              data-testid="contexts-new-title"
            />
          </div>
          <div>
            <label htmlFor="slug" className="block text-sm font-semibold text-gray-700">
              Slug (optional)
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="bitcoin-agent"
              data-testid="contexts-new-slug"
            />
          </div>
        </div>
        <div>
          <label htmlFor="summary" className="block text-sm font-semibold text-gray-700">
            Summary
          </label>
          <textarea
            id="summary"
            name="summary"
            rows={3}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            data-testid="contexts-new-summary"
          />
        </div>
        <div>
          <label htmlFor="tags" className="block text-sm font-semibold text-gray-700">
            Tags (comma or newline separated)
          </label>
          <textarea
            id="tags"
            name="tags"
            rows={2}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="ai, agent, productivity"
            data-testid="contexts-new-tags"
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="createdDate" className="block text-sm font-semibold text-gray-700">
              Created date
            </label>
            <input
              id="createdDate"
              name="createdDate"
              type="date"
              defaultValue={today}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              data-testid="contexts-new-created"
            />
          </div>
          <div>
            <label htmlFor="updatedDate" className="block text-sm font-semibold text-gray-700">
              Updated date
            </label>
            <input
              id="updatedDate"
              name="updatedDate"
              type="date"
              defaultValue={today}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              data-testid="contexts-new-updated"
            />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">Status</p>
          <div className="mt-2 flex items-center gap-6 text-sm">
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="isPublished" value="published" defaultChecked className="h-4 w-4 text-emerald-600" data-testid="contexts-new-status-published" />
              Published
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="isPublished" value="draft" className="h-4 w-4 text-emerald-600" data-testid="contexts-new-status-draft" />
              Draft
            </label>
          </div>
        </div>
        <MarkdownField
          name="content"
          label="Content (Markdown)"
          rows={16}
          placeholder={'## Overview\n\nDescribe how to use this context...'}
          helperText="Supports callouts, lists, and MDX shortcodes. Preview before publishing."
          tone="emerald"
          textareaTestId="contexts-new-content"
          previewButtonTestId="contexts-new-preview"
        />
        <MarkdownUploadHelper buttonTestId="contexts-new-upload" statusTestId="contexts-new-upload-status" />
        <div className="flex justify-end">
          <button type="submit" className="rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-500" data-testid="contexts-new-submit">
            Create context
          </button>
        </div>
      </form>
    </div>
  );
}
