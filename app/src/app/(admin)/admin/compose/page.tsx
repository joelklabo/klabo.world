import { requireAdminSession } from '@/lib/adminSession';
import { ImageUploadField } from '@/app/(admin)/components/image-upload-field';
import { MarkdownField } from '@/app/(admin)/components/markdown-field';
import { createPostAction } from '../posts/actions';
import { Button, Input, Textarea } from '@klaboworld/ui';
import { Label } from '@/components/ui/label';

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
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            type="text"
            required
            placeholder="e.g. Agentically Engineering Past Procrastination"
            data-testid="compose-title"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="summary">Summary</Label>
          <Textarea
            id="summary"
            name="summary"
            required
            rows={3}
            data-testid="compose-summary"
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              name="tags"
              type="text"
              placeholder="bitcoin, lightning"
              data-testid="compose-tags"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="publishDate">Publish date</Label>
            <Input
              id="publishDate"
              name="publishDate"
              type="date"
              data-testid="compose-publish-date"
            />
            <p className="text-xs text-muted-foreground">Leave blank to publish immediately.</p>
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
          <Button
            type="reset"
            variant="outline"
            data-testid="compose-reset"
          >
            Reset
          </Button>
          <Button
            type="submit"
            data-testid="compose-submit"
          >
            Publish post
          </Button>
        </div>
      </form>
    </div>
  );
}
