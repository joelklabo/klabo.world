import Link from 'next/link';
import { Metadata } from 'next';
import { formatPostDate, getPosts } from '@/lib/posts';
import { Button } from '@/components/ui/button';
import { ViewTransitionLink } from '@/components/view-transition-link';

export const metadata: Metadata = {
  title: 'Posts',
};

export default function PostsIndex() {
  const posts = getPosts();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute -left-20 -top-10 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-secondary/18 blur-3xl" />
      </div>
      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Writing</p>
            <h1 className="text-4xl font-bold tracking-tight text-balance">Posts</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Long-form guides, experiments, and notes pulled straight from Contentlayer.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/posts/tags">Browse tags</Link>
          </Button>
        </header>
        <ul className="grid gap-5 sm:grid-cols-2">
          {posts.map((post) => (
            <li key={post._id}>
              <article className="card-hover-lift group h-full rounded-2xl border border-border/60 bg-card/80 p-5 shadow-[0_18px_45px_rgba(6,10,20,0.45)]">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  <time>{formatPostDate(post.publishDate ?? post.date)}</time>
                  {post.tags?.[0] ? (
                    <Link
                      href={`/posts/tag/${encodeURIComponent(post.tags[0])}`}
                      className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[10px] font-semibold text-foreground transition-colors hover:border-primary/60 hover:bg-primary/15"
                    >
                      {post.tags[0]}
                    </Link>
                  ) : (
                    <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-[10px] text-muted-foreground">
                      Post
                    </span>
                  )}
                </div>
                <h2 className="mt-3 text-xl font-semibold leading-snug text-foreground">
                  <ViewTransitionLink href={`/posts/${post.slug}`} className="hover:text-primary">
                    {post.title}
                  </ViewTransitionLink>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{post.summary}</p>
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
                    {post.tags.slice(0, 4).map((tag) => (
                      <Link
                        key={tag}
                        href={`/posts/tag/${encodeURIComponent(tag)}`}
                        className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-foreground transition-colors hover:border-primary/60 hover:bg-primary/15"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}
              </article>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
