import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getEditablePostBySlug } from '@/lib/posts';
import { ImageUploadField } from '@/app/(admin)/components/image-upload-field';
import { MarkdownField } from '@/app/(admin)/components/markdown-field';
import { updatePostAction, deletePostAction } from '../../actions';
import { Button } from '@/components/ui/button';

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
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-indigo-500">Posts</p>
          <h1 className="text-3xl font-bold">Edit post</h1>
        </div>
        <Link href="/admin" className="text-sm font-semibold text-gray-500 hover:text-gray-700">
          ← Back to dashboard
        </Link>
      </div>
      <form action={updateAction} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={post.title}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="summary" className="block text-sm font-semibold text-gray-700">
            Summary
          </label>
          <textarea
            id="summary"
            name="summary"
            rows={3}
            defaultValue={post.summary}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="tags" className="block text-sm font-semibold text-gray-700">
              Tags (comma-separated)
            </label>
            <input
              id="tags"
              name="tags"
              type="text"
              defaultValue={post.tags?.join(', ')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              defaultValue={(post.publishDate ?? post.date).slice(0, 10)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">nostrstack</p>
            <p className="text-sm text-gray-600">Optional metadata for tips, Nostr share, and comments.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="lightningAddress" className="block text-sm font-semibold text-gray-700">
                Lightning address
              </label>
              <input
                id="lightningAddress"
                name="lightningAddress"
                type="email"
                defaultValue={post.lightningAddress ?? ''}
                placeholder="joel@nostrstack.lol"
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="nostrPubkey" className="block text-sm font-semibold text-gray-700">
                Nostr pubkey (npub or hex)
              </label>
              <input
                id="nostrPubkey"
                name="nostrPubkey"
                type="text"
                defaultValue={post.nostrPubkey ?? ''}
                placeholder="npub1..."
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="nostrRelays" className="block text-sm font-semibold text-gray-700">
              Nostr relays (comma separated)
            </label>
            <textarea
              id="nostrRelays"
              name="nostrRelays"
              rows={2}
              defaultValue={post.nostrRelays?.join(', ') ?? ''}
              placeholder="wss://relay.damus.io, wss://relay.snort.social"
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="nostrstackEnabled"
              defaultChecked={post.nostrstackEnabled !== false}
              className="h-4 w-4 rounded border-gray-300"
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
