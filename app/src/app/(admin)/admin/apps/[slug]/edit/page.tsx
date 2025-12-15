import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getEditableAppBySlug } from '@/lib/apps';
import { requireAdminSession } from '@/lib/adminSession';
import { ImageUploadField } from '@/app/(admin)/components/image-upload-field';
import { ImageListUploadField } from '@/app/(admin)/components/image-list-upload-field';
import { upsertAppAction, deleteAppAction } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Apps</p>
          <h1 className="text-3xl font-bold text-foreground">Edit app</h1>
        </div>
        <Link href="/admin/apps" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
          ← Back to apps
        </Link>
      </div>
      <form action={upsertAppAction} className="space-y-6" data-testid="apps-edit-form">
        <input type="hidden" name="slug" defaultValue={app.slug} data-testid="apps-edit-slug" />
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            defaultValue={app.name}
            required
            data-testid="apps-edit-name"
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="version">Version</Label>
            <Input
              id="version"
              name="version"
              type="text"
              defaultValue={app.version}
              required
              data-testid="apps-edit-version"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="publishDate">Publish date</Label>
            <Input
              id="publishDate"
              name="publishDate"
              type="date"
              defaultValue={app.publishDate.slice(0, 10)}
              required
              data-testid="apps-edit-publish-date"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fullDescription">Description</Label>
          <Textarea
            id="fullDescription"
            name="fullDescription"
            rows={5}
            defaultValue={app.fullDescription}
            required
            data-testid="apps-edit-description"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="features">Features (one per line)</Label>
          <Textarea
            id="features"
            name="features"
            rows={6}
            defaultValue={app.features?.join('\n')}
            data-testid="apps-edit-features"
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="appStoreURL">App Store URL</Label>
            <Input
              id="appStoreURL"
              name="appStoreURL"
              type="url"
              defaultValue={app.appStoreURL ?? ''}
              data-testid="apps-edit-appstore"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="githubURL">GitHub URL</Label>
            <Input
              id="githubURL"
              name="githubURL"
              type="url"
              defaultValue={app.githubURL ?? ''}
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
        <div className="flex justify-between gap-3">
          <Button
            type="submit"
            formAction={deleteAction}
            variant="destructive-outline"
            size="lg"
            data-testid="apps-edit-delete"
          >
            Delete app
          </Button>
          <Button type="submit" size="lg" data-testid="apps-edit-submit">
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
