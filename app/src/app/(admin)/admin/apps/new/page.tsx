import Link from 'next/link';
import type { Metadata } from 'next';
import { requireAdminSession } from '@/lib/adminSession';
import { ImageUploadField } from '@/app/(admin)/components/image-upload-field';
import { ImageListUploadField } from '@/app/(admin)/components/image-list-upload-field';
import { upsertAppAction } from '../[slug]/actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'New app • Admin',
};

export default async function NewAppPage() {
  await requireAdminSession();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-purple-500">Apps</p>
          <h1 className="text-3xl font-bold">Create app listing</h1>
          <p className="mt-2 text-sm text-gray-500">Provide metadata, features, and screenshots for the apps page.</p>
        </div>
        <Link href="/admin/apps" className="text-sm font-semibold text-gray-500 hover:text-gray-700">
          ← Back to apps
        </Link>
      </div>
      <form action={upsertAppAction} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="ViceChips"
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
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="vicechips"
            />
            <p className="mt-1 text-xs text-gray-500">If omitted we will slugify the name automatically.</p>
          </div>
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
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder={'Chip Budget System\nRollover Support'}
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
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <ImageUploadField
            name="icon"
            label="Icon path"
            placeholder="/uploads/app-icons/vicechips.png"
            helperText="Ideal size 512x512. Upload new assets or reuse an existing /app-icons path."
            tone="purple"
          />
          <ImageListUploadField
            name="screenshots"
            label="Screenshots (one per line)"
            placeholder="/uploads/screens/vicechips-dashboard.png"
            helperText="Upload screenshots and we will append the URLs to this list."
            tone="purple"
          />
        </div>
        <div className="flex justify-end">
          <button type="submit" className="rounded-full bg-purple-600 px-6 py-2 text-sm font-semibold text-white hover:bg-purple-500">
            Create app
          </button>
        </div>
      </form>
    </div>
  );
}
