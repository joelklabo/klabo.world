import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getEditableAppBySlug } from '@/lib/apps';
import { requireAdminSession } from '@/lib/adminSession';
import { ImageUploadField } from '@/app/(admin)/components/image-upload-field';
import { ImageListUploadField } from '@/app/(admin)/components/image-list-upload-field';
import { upsertAppAction, deleteAppAction } from '../actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const app = await getEditableAppBySlug(slug);
  if (!app) {
    return { title: 'App not found • Admin' };
  }
  return { title: `Edit ${app.name} • Admin`, description: app.fullDescription };
}

export default async function EditAppPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdminSession();
  const { slug } = await params;
  const app = await getEditableAppBySlug(slug);
  if (!app) {
    notFound();
  }
  const deleteAction = deleteAppAction.bind(null, app.slug);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-purple-500">Apps</p>
          <h1 className="text-3xl font-bold">Edit app</h1>
        </div>
        <Link href="/admin/apps" className="text-sm font-semibold text-gray-500 hover:text-gray-700">
          ← Back to apps
        </Link>
      </div>
      <form action={upsertAppAction} className="space-y-6" data-testid="apps-edit-form">
        <input type="hidden" name="slug" defaultValue={app.slug} data-testid="apps-edit-slug" />
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={app.name}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            data-testid="apps-edit-name"
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="version" className="block text-sm font-semibold text-gray-700">
              Version
            </label>
            <input
              id="version"
              name="version"
              type="text"
              defaultValue={app.version}
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              data-testid="apps-edit-version"
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
              defaultValue={app.publishDate.slice(0, 10)}
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              data-testid="apps-edit-publish-date"
            />
          </div>
        </div>
        <div>
          <label htmlFor="fullDescription" className="block text-sm font-semibold text-gray-700">
            Description
          </label>
          <textarea
            id="fullDescription"
            name="fullDescription"
            rows={5}
            defaultValue={app.fullDescription}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            data-testid="apps-edit-description"
          />
        </div>
        <div>
          <label htmlFor="features" className="block text-sm font-semibold text-gray-700">
            Features (one per line)
          </label>
          <textarea
            id="features"
            name="features"
            rows={6}
            defaultValue={app.features?.join('\n')}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            data-testid="apps-edit-features"
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="appStoreURL" className="block text-sm font-semibold text-gray-700">
              App Store URL
            </label>
            <input
              id="appStoreURL"
              name="appStoreURL"
              type="url"
              defaultValue={app.appStoreURL ?? ''}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              data-testid="apps-edit-appstore"
            />
          </div>
          <div>
            <label htmlFor="githubURL" className="block text-sm font-semibold text-gray-700">
              GitHub URL
            </label>
            <input
              id="githubURL"
              name="githubURL"
              type="url"
              defaultValue={app.githubURL ?? ''}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              data-testid="apps-edit-github"
            />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <ImageUploadField
            name="icon"
            label="Icon path"
            defaultValue={app.icon ?? ''}
            helperText="Ideal size 512x512. Upload new assets or reuse /app-icons."
            tone="purple"
            inputTestId="apps-edit-icon"
            uploadButtonTestId="apps-edit-icon-upload"
          />
          <ImageListUploadField
            name="screenshots"
            label="Screenshots (one per line)"
            defaultValue={app.screenshots?.join('\n') ?? ''}
            helperText="Uploads append to the textarea automatically."
            tone="purple"
            textareaTestId="apps-edit-screenshots"
            uploadButtonTestId="apps-edit-screenshot-upload"
          />
        </div>
        <div className="flex justify-between">
          <button
            type="submit"
            formAction={deleteAction}
            className="rounded-full border border-red-200 px-5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
            data-testid="apps-edit-delete"
          >
            Delete app
          </button>
          <button type="submit" className="rounded-full bg-purple-600 px-6 py-2 text-sm font-semibold text-white hover:bg-purple-500" data-testid="apps-edit-submit">
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
