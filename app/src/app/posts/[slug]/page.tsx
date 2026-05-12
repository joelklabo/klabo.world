import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getPostBySlug, getPosts, getPostReadableBody, normalizePostSlug } from '@/lib/posts';
import { MDXContent } from '@/components/mdx-content';
import { ContentDate } from '@/components/content-date';
import { getPublicSiteUrl } from '@/lib/public-env';
import { LightningTipWidget } from '@/components/lightning';
import { runPublicSlugMetadata, runPublicSlugPage } from '@/lib/publicPageHelpers';

type Params = { slug: string };

export const dynamic = 'force-dynamic';
const DEFAULT_POST_HERO_IMAGE = '/images/posts/klabo-world-editorial-hero.webp';

function getImageMimeType(src: string) {
  if (src.endsWith('.webp')) return 'image/webp';
  if (src.endsWith('.png')) return 'image/png';
  if (src.endsWith('.jpg') || src.endsWith('.jpeg')) return 'image/jpeg';
  return 'image/svg+xml';
}

export function generateStaticParams(): Params[] {
  return getPosts({ includeUnpublished: true }).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Params | Promise<Params> }): Promise<Metadata> {
  return runPublicSlugMetadata(
    params,
    getPostBySlug,
    (post) => {
      if (!post) {
        return { title: 'Post not found' };
      }

      const siteUrl = getPublicSiteUrl();
      const canonicalPath = `/posts/${post.slug}`;
      const publishedTime = post.publishDate ?? post.date;
      const heroImage = post.featuredImage ?? DEFAULT_POST_HERO_IMAGE;

      return {
        title: post.title,
        description: post.summary,
        alternates: { canonical: canonicalPath },
        openGraph: {
          type: 'article',
          url: canonicalPath,
          title: post.title,
          description: post.summary,
          publishedTime,
          tags: post.tags ?? [],
          images: [
            {
              url: new URL(heroImage, siteUrl),
              width: 1600,
              height: 900,
              alt: post.title,
              type: getImageMimeType(heroImage),
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title: post.title,
          description: post.summary,
          images: [new URL(heroImage, siteUrl)],
        },
      };
    },
    () => ({ title: 'Post not found' }),
  );
}

export default async function PostPage({ params }: { params: Params | Promise<Params> }) {
  return runPublicSlugPage(
    params,
    getPostBySlug,
    (post, requestedSlug) => {
      if (!post) {
        return notFound();
      }

      if (normalizePostSlug(post.slug) !== normalizePostSlug(requestedSlug)) {
        permanentRedirect(`/posts/${post.slug}`);
      }
      const postBody = getPostReadableBody(post);
      if (!postBody) {
        notFound();
      }
      const { code: bodyCode, readingTime } = postBody;
      const posts = getPosts();
      const index = posts.findIndex((entry) => entry.slug === post.slug);
      const previous = posts[index - 1];
      const next = posts[index + 1];
      const siteUrl = getPublicSiteUrl();
      const canonicalUrl = `${siteUrl}/posts/${post.slug}`;
      const lightningAddress = post.lightningAddress ?? 'joel@klabo.world';
      const publishedDate = post.publishDate ?? post.date;
      const heroImage = post.featuredImage ?? DEFAULT_POST_HERO_IMAGE;
      const heroImageUrl = new URL(heroImage, siteUrl).toString();
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.summary,
        datePublished: publishedDate,
        dateModified: publishedDate,
        url: canonicalUrl,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl,
        },
        image: [heroImageUrl],
        keywords: post.tags ?? [],
        publisher: {
          '@type': 'Organization',
          name: 'klabo.world',
          url: siteUrl,
        },
      };

    return (
      <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="relative isolate min-h-[560px] overflow-hidden border-b border-border/60 sm:min-h-[620px]">
        <Image
          src={heroImage}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,10,20,0.94)_0%,rgba(5,10,20,0.78)_42%,rgba(5,10,20,0.28)_78%,rgba(5,10,20,0.58)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,10,20,0.18)_0%,rgba(5,10,20,0.16)_48%,rgba(5,10,20,0.92)_100%)]" />
        <div className="relative mx-auto flex min-h-[560px] max-w-6xl items-end px-6 py-12 sm:min-h-[620px] sm:py-16">
          <div className="max-w-4xl space-y-5">
            <Link
              href="/posts"
              className="inline-flex items-center gap-2 rounded text-xs font-semibold uppercase tracking-[0.35em] text-primary hover:text-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-label="Back to all posts"
            >
              ← Back to posts
            </Link>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/75">
              <ContentDate
                value={publishedDate}
                options={{
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                }}
              />
              <span>{readingTime} min read</span>
              <span>{previous ? 'Chronological' : 'Latest'} · {posts.length} post{posts.length === 1 ? '' : 's'}</span>
            </div>
            <h1 className="text-4xl font-semibold leading-tight text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.75)] md:text-6xl">
              {post.title}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-white/78 md:text-xl md:leading-8">
              {post.summary}
            </p>
            <div className="flex flex-wrap gap-3">
              {post.tags?.map((tag) => (
                <Link
                  key={tag}
                  href={`/posts/tag/${encodeURIComponent(tag)}`}
                  className="rounded-full border border-primary/35 bg-primary/15 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.32em] text-white backdrop-blur motion-safe:transition-colors hover:border-primary/70 hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="relative mx-auto max-w-6xl px-6 py-12 sm:py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)]">
          <section className="min-w-0 space-y-8">
            {lightningAddress && (
              <LightningTipWidget lightningAddress={lightningAddress} namespace={`post:${post.slug}`} />
            )}
            <div className="rounded-3xl border border-border/60 bg-card/80 p-8 shadow-[0_24px_70px_rgba(6,10,20,0.55)]">
              <div className="prose max-w-none space-y-8">
                <MDXContent code={bodyCode} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 text-sm text-muted-foreground sm:grid-cols-2">
              {previous && (
                <Link
                  href={`/posts/${previous.slug}`}
                  className="card-hover-lift rounded-3xl border border-border/60 bg-card/80 p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  aria-label={`Previous post: ${previous.title}`}
                >
                  <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Previous</p>
                  <p className="mt-2 text-base font-semibold text-foreground">{previous.title}</p>
                </Link>
              )}
              {next && (
                <Link
                  href={`/posts/${next.slug}`}
                  className="card-hover-lift rounded-3xl border border-border/60 bg-card/80 p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  aria-label={`Next post: ${next.title}`}
                >
                  <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Next</p>
                  <p className="mt-2 text-base font-semibold text-foreground">{next.title}</p>
                </Link>
              )}
            </div>
          </section>
          <aside className="space-y-6" aria-label="Post sidebar">
            <div className="sticky top-20 space-y-6">
              <section className="space-y-4 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-[0_24px_70px_rgba(6,10,20,0.55)]" aria-labelledby="post-details-heading">
                <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground" id="post-details-heading">Post Details</h2>
                <p className="text-sm text-muted-foreground text-pretty">{post.summary}</p>
                <dl className="space-y-3 text-xs uppercase tracking-[0.35em] text-muted-foreground">
                  <div>
                    <dt className="text-[10px] text-muted-foreground/70">Published</dt>
                    <dd className="text-sm text-foreground"><ContentDate value={post.date} /></dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-muted-foreground/70">Reading time</dt>
                    <dd className="text-sm text-foreground">{readingTime} mins</dd>
                  </div>
                </dl>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground/70" id="quick-tags-label">Quick tags</p>
                  <ul className="mt-3 flex flex-wrap gap-2" role="list" aria-labelledby="quick-tags-label">
                    {post.tags?.map((tag) => (
                      <li key={tag}>
                        <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-foreground">
                          {tag}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                {post.xPostId && (
                  <div className="border-t border-border/40 pt-4">
                    <a
                      href={`https://x.com/i/web/status/${post.xPostId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      Read on X
                    </a>
                  </div>
                )}
              </section>
            </div>
          </aside>
        </div>
      </div>
      </div>
    );
    },
    () => notFound(),
  );
}
