import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getEditableContextBySlug } from '@/lib/contexts';
import { requireAdminSession } from '@/lib/adminSession';
import { MarkdownUploadHelper } from '@/app/(admin)/components/upload-helper';
import { MarkdownField } from '@/app/(admin)/components/markdown-field';
import { deleteContextAction, upsertContextAction } from '../../actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const context = await getEditableContextBySlug(slug);
  if (!context) {
    return { title: 'Context not found • Admin' };
  }
  return { title: `Edit ${context.title} • Admin`, description: context.summary };
}

export default async function EditContextPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdminSession();
  const { slug } = await params;
  const context = await getEditableContextBySlug(slug);
  if (!context) {
    notFound();
  }
  const deleteAction = deleteContextAction.bind(null, context.slug);
  const createdDate = context.createdDate ? context.createdDate.slice(0, 10) : '';
  const updatedDate = context.updatedDate ? context.updatedDate.slice(0, 10) : '';

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-emerald-500">Contexts</p>
          <h1 className="text-3xl font-bold">Edit context</h1>
        </div>
        <Link href="/admin/contexts" className="text-sm font-semibold text-gray-500 hover:text-gray-700">
          ← Back to contexts
        </Link>
      </div>
      <form action={upsertContextAction} className="space-y-6">
        <input type="hidden" name="slug" defaultValue={context.slug} />
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700">
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              defaultValue={context.title}
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="summary" className="block text-sm font-semibold text-gray-700">
              Summary
            </label>
            <textarea
              id="summary"
              name="summary"
              defaultValue={context.summary}
              rows={3}
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        <div>
          <label htmlFor="tags" className="block text-sm font-semibold text-gray-700">
            Tags
          </label>
          <textarea
            id="tags"
            name="tags"
            rows={2}
            defaultValue={context.tags?.join(', ') ?? ''}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              defaultValue={createdDate}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              defaultValue={updatedDate}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">Status</p>
          <div className="mt-2 flex items-center gap-6 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="isPublished"
                value="published"
                defaultChecked={context.isPublished}
                className="h-4 w-4 text-emerald-600"
              />
              Published
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="isPublished"
                value="draft"
                defaultChecked={!context.isPublished}
                className="h-4 w-4 text-emerald-600"
              />
              Draft
            </label>
          </div>
        </div>
        <MarkdownField
          name="content"
          label="Content (Markdown)"
          defaultValue={context.body}
          helperText="Preview ensures tags, callouts, and code samples render correctly."
          tone="emerald"
        />
        <MarkdownUploadHelper />
        <div className="flex items-center justify-between">
          <button
            type="submit"
            formAction={deleteAction}
            className="rounded-full border border-red-200 px-5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Delete context
          </button>
          <button type="submit" className="rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
