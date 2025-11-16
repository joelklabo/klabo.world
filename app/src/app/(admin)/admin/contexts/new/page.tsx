import Link from 'next/link';
import type { Metadata } from 'next';
import { requireAdminSession } from '@/lib/adminSession';
import { MarkdownUploadHelper } from '@/app/(admin)/components/upload-helper';
import { MarkdownField } from '@/app/(admin)/components/markdown-field';
import { upsertContextAction } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              type="text"
              required
              data-testid="contexts-new-title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug (optional)</Label>
            <Input
              id="slug"
              name="slug"
              type="text"
              placeholder="bitcoin-agent"
              data-testid="contexts-new-slug"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="summary">Summary</Label>
          <Textarea
            id="summary"
            name="summary"
            rows={3}
            required
            data-testid="contexts-new-summary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma or newline separated)</Label>
          <Textarea
            id="tags"
            name="tags"
            rows={2}
            placeholder="ai, agent, productivity"
            data-testid="contexts-new-tags"
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="createdDate">Created date</Label>
            <Input
              id="createdDate"
              name="createdDate"
              type="date"
              defaultValue={today}
              data-testid="contexts-new-created"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="updatedDate">Updated date</Label>
            <Input
              id="updatedDate"
              name="updatedDate"
              type="date"
              defaultValue={today}
              data-testid="contexts-new-updated"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <div className="flex items-center gap-6 text-sm">
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
          <Button type="submit" data-testid="contexts-new-submit">
            Create context
          </Button>
        </div>
      </form>
    </div>
  );
}
