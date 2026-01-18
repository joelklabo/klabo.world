'use client';

import { useActionState, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { ImageUploadField } from './image-upload-field';
import { MarkdownField } from './markdown-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { type EditablePost } from '@/lib/posts';
import { type ActionState, shareToXAction } from '../admin/posts/actions';

type PostFormProps = {
  upsertAction: (state: ActionState, formData: FormData) => Promise<ActionState>;
  deleteAction?: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initialData?: Partial<EditablePost> & { xPostId?: string | null };
  mode: 'create' | 'edit';
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? 'Saving...' : label}
    </Button>
  );
}

function DeleteButton({ action }: { action: (payload: FormData) => void }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      formAction={action}
      variant="destructive-outline"
      size="lg"
      disabled={pending}
    >
      {pending ? 'Deleting...' : 'Delete'}
    </Button>
  );
}

function ShareToXButton({ slug, xPostId }: { slug: string; xPostId?: string | null }) {
  const [isPending, startTransition] = useTransition();
  const [currentXPostId, setCurrentXPostId] = useState(xPostId);
  const [error, setError] = useState<string | null>(null);

  const handleShare = () => {
    setError(null);
    startTransition(async () => {
      const result = await shareToXAction(slug);
      if (result.success && result.postId) {
        setCurrentXPostId(result.postId);
      } else {
        setError(result.error || 'Failed to share');
      }
    });
  };

  if (currentXPostId) {
    return (
      <a
        href={`https://x.com/i/web/status/${currentXPostId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
      >
        Shared on X
      </a>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={handleShare}
        disabled={isPending}
      >
        {isPending ? 'Sharing...' : 'Share to X'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function PostForm({ upsertAction, deleteAction, initialData, mode }: PostFormProps) {
  const [state, formAction] = useActionState(upsertAction, { message: '', success: false });
  const [deleteState, deleteFormAction] = useActionState(deleteAction || (async () => ({ message: '', success: false })), { message: '', success: false });

  return (
    <form action={formAction} className="space-y-6">
      {state.message && !state.success && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}
      {deleteState.message && !deleteState.success && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {deleteState.message}
        </div>
      )}
      {mode === 'edit' && initialData?.slug && (
        <input type="hidden" name="slug" defaultValue={initialData.slug} />
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          type="text"
          defaultValue={initialData?.title}
          required
        />
        {state.errors?.title && <p className="text-xs text-destructive">{state.errors.title.join(', ')}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          name="summary"
          rows={3}
          defaultValue={initialData?.summary}
          required
        />
        {state.errors?.summary && <p className="text-xs text-destructive">{state.errors.summary.join(', ')}</p>}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            name="tags"
            type="text"
            defaultValue={initialData?.tags?.join(', ')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="publishDate">Publish date</Label>
          <Input
            id="publishDate"
            name="publishDate"
            type="date"
            defaultValue={(initialData?.publishDate ?? initialData?.date)?.slice(0, 10)}
          />
          {state.errors?.publishDate && <p className="text-xs text-destructive">{state.errors.publishDate.join(', ')}</p>}
        </div>
      </div>
      <div className="space-y-3 rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">nostrstack</p>
          <p className="text-sm text-muted-foreground">Optional metadata for tips, Nostr share, and comments.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="lightningAddress">Lightning address</Label>
            <Input
              id="lightningAddress"
              name="lightningAddress"
              type="email"
              defaultValue={initialData?.lightningAddress ?? ''}
              placeholder="joel@nostrstack.lol"
            />
            {state.errors?.lightningAddress && <p className="text-xs text-destructive">{state.errors.lightningAddress.join(', ')}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nostrPubkey">Nostr pubkey (npub or hex)</Label>
            <Input
              id="nostrPubkey"
              name="nostrPubkey"
              type="text"
              defaultValue={initialData?.nostrPubkey ?? ''}
              placeholder="npub1..."
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nostrRelays">Nostr relays (comma separated)</Label>
          <Textarea
            id="nostrRelays"
            name="nostrRelays"
            rows={2}
            defaultValue={initialData?.nostrRelays?.join(', ') ?? ''}
            placeholder="wss://relay.damus.io, wss://relay.snort.social"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="nostrstackEnabled"
            defaultChecked={initialData?.nostrstackEnabled !== false}
            className="h-4 w-4 rounded border-input"
          />
          Enable nostrstack widgets for this post
        </label>
      </div>
      <ImageUploadField
        name="featuredImage"
        label="Featured image path"
        defaultValue={initialData?.featuredImage ?? ''}
        helperText="Uploads are stored under /uploads — link directly to the generated path."
        tone="indigo"
      />
      <MarkdownField
        name="content"
        label="Content (Markdown)"
        defaultValue={initialData?.body}
        helperText="Use Preview to validate gist embeds, lists, and MDX components."
        tone="indigo"
      />
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-2">
          {mode === 'edit' && deleteAction && (
            <DeleteButton action={deleteFormAction} />
          )}
        </div>
        <div className="flex items-center gap-3">
          {mode === 'edit' && initialData?.slug && (
            <ShareToXButton slug={initialData.slug} xPostId={initialData.xPostId} />
          )}
          <SubmitButton label={mode === 'edit' ? 'Save changes' : 'Publish post'} />
        </div>
      </div>
    </form>
  );
}
