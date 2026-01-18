import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostTagCounts, getPosts } from '@/lib/posts';
import { Button } from '@/components/ui/button';

type Params = { tag: string };

export function generateStaticParams(): Params[] {
  return Object.keys(getPostTagCounts()).map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: { params: Params | Promise<Params> }): Promise<Metadata> {
  const { tag: rawTag } = await Promise.resolve(params);
  const tag = decodeURIComponent(rawTag);
  const posts = getPosts().filter((post) => post.tags?.includes(tag));
  if (posts.length === 0) {
    return { title: 'Tag not found' };
  }
  return { title: `${tag} posts` };
}

export default async function PostTagPage({ params }: { params: Params | Promise<Params> }) {
  const { tag: rawTag } = await Promise.resolve(params);
  const tag = decodeURIComponent(rawTag);
  const posts = getPosts().filter((post) => post.tags?.includes(tag));
  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute -left-20 -top-10 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-secondary/18 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-6xl px-6 py-16">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Tag</p>
            <h1 className="text-4xl font-bold tracking-tight text-foreground text-balance">{tag}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">Posts filed under “{tag}”.</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/posts/tags">← Back to all tags</Link>
          </Button>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {posts.map((post) => (
            <article
              key={post._id}
              className="card-hover-lift group h-full rounded-2xl border border-border/60 bg-card/80 p-5 shadow-[0_18px_45px_rgba(6,10,20,0.45)]"
            >
              <time dateTime={new Date(post.publishDate ?? post.date).toISOString()} className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {new Date(post.publishDate ?? post.date).toLocaleDateString()}
              </time>
              <h2 className="mt-3 text-xl font-semibold leading-snug text-foreground">
                <Link href={`/posts/${post.slug}`} className="hover:text-primary rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3 text-pretty">{post.summary}</p>
              {post.tags && post.tags.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-primary" role="list" aria-label="Post tags">
                  {post.tags.slice(0, 4).map((entry) => (
                    <li key={entry}>
                      <Link
                        href={`/posts/tag/${encodeURIComponent(entry)}`}
                        className="inline-block rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-foreground motion-safe:transition-colors hover:border-primary/60 hover:bg-primary/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                      >
                        {entry}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
