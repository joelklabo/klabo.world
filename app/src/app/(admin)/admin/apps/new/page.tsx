import Link from 'next/link';
import type { Metadata } from 'next';
import { requireAdminSession } from '@/lib/adminSession';
import { ImageUploadField } from '@/app/(admin)/components/image-upload-field';
import { ImageListUploadField } from '@/app/(admin)/components/image-list-upload-field';
import { upsertAppAction } from '../[slug]/actions';
import { Button, Input, Label, Textarea } from '@klaboworld/ui';

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
      <form action={upsertAppAction} className="space-y-6" data-testid="apps-new-form">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              placeholder="ViceChips"
              data-testid="apps-new-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug (optional)</Label>
            <Input
              id="slug"
              name="slug"
              type="text"
              placeholder="vicechips"
              data-testid="apps-new-slug"
            />
            <p className="text-xs text-muted-foreground">If omitted we will slugify the name automatically.</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="version">Version</Label>
            <Input
              id="version"
              name="version"
              type="text"
              required
              data-testid="apps-new-version"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="publishDate">Publish date</Label>
            <Input
              id="publishDate"
              name="publishDate"
              type="date"
              required
              data-testid="apps-new-publish-date"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fullDescription">Description</Label>
          <Textarea
            id="fullDescription"
            name="fullDescription"
            rows={5}
            required
            data-testid="apps-new-description"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="features">Features (one per line)</Label>
          <Textarea
            id="features"
            name="features"
            rows={6}
            placeholder={'Chip Budget System\nRollover Support'}
            data-testid="apps-new-features"
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="appStoreURL">App Store URL</Label>
            <Input
              id="appStoreURL"
              name="appStoreURL"
              type="url"
              data-testid="apps-new-appstore"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="githubURL">GitHub URL</Label>
            <Input
              id="githubURL"
              name="githubURL"
              type="url"
              data-testid="apps-new-github"
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
            inputTestId="apps-new-icon"
            uploadButtonTestId="apps-new-icon-upload"
          />
        <ImageListUploadField
            name="screenshots"
            label="Screenshots (one per line)"
            placeholder="/uploads/screens/vicechips-dashboard.png"
            helperText="Upload screenshots and we will append the URLs to this list."
            tone="purple"
            textareaTestId="apps-new-screenshots"
            uploadButtonTestId="apps-new-screenshot-upload"
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" data-testid="apps-new-submit">
            Create app
          </Button>
        </div>
      </form>
    </div>
  );
}
