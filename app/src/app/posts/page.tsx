import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { getPosts } from '@/lib/posts';
import { ContentDate } from '@/components/content-date';
import { Button } from '@/components/ui/button';
import { ViewTransitionLink } from '@/components/view-transition-link';

export const metadata: Metadata = {
  title: 'Posts',
};

const DEFAULT_POST_HERO_IMAGE = '/images/posts/klabo-world-editorial-hero.webp';

export default function PostsIndex() {
  const posts = getPosts();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
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
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {posts.map((post) => (
            <li key={post._id}>
              <article className="card-hover-lift group h-full overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-[0_18px_45px_rgba(6,10,20,0.45)]">
                <ViewTransitionLink
                  href={`/posts/${post.slug}`}
                  className="relative block aspect-[16/9] overflow-hidden bg-background"
                  aria-label={`Read ${post.title}`}
                >
                  <Image
                    src={post.featuredImage ?? DEFAULT_POST_HERO_IMAGE}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 560px"
                    className="object-cover motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/75 via-background/15 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/80">
                    <ContentDate value={post.publishDate} fallback={post.date} />
                    <span className="rounded-full border border-white/20 bg-black/35 px-3 py-1 text-white/80 backdrop-blur">
                      {post.tags?.[0] ?? 'Post'}
                    </span>
                  </div>
                </ViewTransitionLink>
                <div className="p-5">
                  <h2 className="text-xl font-semibold leading-snug text-foreground">
                    <ViewTransitionLink href={`/posts/${post.slug}`} className="hover:text-primary">
                      {post.title}
                    </ViewTransitionLink>
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground text-pretty line-clamp-3">{post.summary}</p>
                  {post.tags && post.tags.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-primary" role="list" aria-label="Post tags">
                      {post.tags.slice(0, 4).map((tag) => (
                        <li key={tag}>
                          <Link
                            href={`/posts/tag/${encodeURIComponent(tag)}`}
                            className="inline-block rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-foreground motion-safe:transition-colors hover:border-primary/60 hover:bg-primary/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                          >
                            {tag}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
