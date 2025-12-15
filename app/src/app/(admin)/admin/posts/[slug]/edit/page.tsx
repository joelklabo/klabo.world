import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getEditablePostBySlug } from '@/lib/posts';
import { ImageUploadField } from '@/app/(admin)/components/image-upload-field';
import { MarkdownField } from '@/app/(admin)/components/markdown-field';
import { updatePostAction, deletePostAction } from '../../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Params = { slug: string };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getEditablePostBySlug(slug);
  if (!post) {
    return { title: 'Post not found • Admin' };
  }
  return { title: `Edit ${post.title} • Admin` };
}

export default async function EditPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await getEditablePostBySlug(slug);
  if (!post) {
    notFound();
  }

  const updateAction = updatePostAction.bind(null, post.slug);
  const deleteAction = deletePostAction.bind(null, post.slug);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Posts</p>
          <h1 className="text-3xl font-bold text-foreground">Edit post</h1>
        </div>
        <Link href="/admin" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
          ← Back to dashboard
        </Link>
      </div>
      <form action={updateAction} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            type="text"
            defaultValue={post.title}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="summary">Summary</Label>
          <Textarea
            id="summary"
            name="summary"
            rows={3}
            defaultValue={post.summary}
            required
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              name="tags"
              type="text"
              defaultValue={post.tags?.join(', ')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="publishDate">Publish date</Label>
            <Input
              id="publishDate"
              name="publishDate"
              type="date"
              defaultValue={(post.publishDate ?? post.date).slice(0, 10)}
            />
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
                defaultValue={post.lightningAddress ?? ''}
                placeholder="joel@nostrstack.lol"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nostrPubkey">Nostr pubkey (npub or hex)</Label>
              <Input
                id="nostrPubkey"
                name="nostrPubkey"
                type="text"
                defaultValue={post.nostrPubkey ?? ''}
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
              defaultValue={post.nostrRelays?.join(', ') ?? ''}
              placeholder="wss://relay.damus.io, wss://relay.snort.social"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="nostrstackEnabled"
              defaultChecked={post.nostrstackEnabled !== false}
              className="h-4 w-4 rounded border-input"
            />
            Enable nostrstack widgets for this post
          </label>
        </div>
        <ImageUploadField
          name="featuredImage"
          label="Featured image path"
          defaultValue={post.featuredImage ?? ''}
          helperText="Uploads are stored under /uploads — link directly to the generated path."
          tone="indigo"
        />
        <MarkdownField
          name="content"
          label="Content (Markdown)"
          defaultValue={post.body}
          helperText="Use Preview to validate gist embeds, lists, and MDX components."
          tone="indigo"
        />
        <div className="flex justify-between">
          <Button type="submit" formAction={deleteAction} variant="destructive-outline" size="lg">
            Delete
          </Button>
          <Button type="submit" size="lg">
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
