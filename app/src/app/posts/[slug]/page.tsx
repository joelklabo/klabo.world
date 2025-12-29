import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPostBySlug, getPosts } from '@/lib/posts';
import { MDXContent } from '@/components/mdx-content';
import { env } from '@/lib/env';
import { NostrstackActionBar, NostrstackComments, NostrstackOmnoster } from '@/components/nostrstack-widgets';

type Params = { slug: string };

function parseLightningAddress(value?: string | null) {
  if (!value) return null;
  const [username, domain] = value.split('@');
  if (!username || !domain) return null;
  return { username, domain };
}

function parseRelayList(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export const dynamic = 'force-dynamic';

export function generateStaticParams(): Params[] {
  return getPosts({ includeUnpublished: true }).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Params | Promise<Params> }): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params as Params);
  const post = getPostBySlug(resolvedParams.slug);
  if (!post) {
    return { title: 'Post not found' };
  }

  const canonicalPath = `/posts/${post.slug}`;
  const publishedTime = post.publishDate ?? post.date;

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
	          url: new URL(`${canonicalPath}/og.png`, env.SITE_URL),
	          width: 1200,
	          height: 630,
	          alt: post.title,
	          type: 'image/png',
	        },
	      ],
	    },
	    twitter: {
	      card: 'summary_large_image',
	      title: post.title,
	      description: post.summary,
	      images: [new URL(`${canonicalPath}/og.png`, env.SITE_URL)],
	    },
	  };
	}

export default async function PostPage({ params }: { params: Params | Promise<Params> }) {
  const resolvedParams = await Promise.resolve(params as Params);
  const post = getPostBySlug(resolvedParams.slug);
  if (!post) {
    notFound();
  }
  const posts = getPosts();
  const index = posts.findIndex((entry) => entry.slug === post.slug);
  const previous = posts[index - 1];
  const next = posts[index + 1];
  const readingTime = Math.max(1, Math.round((post.body.raw.split(/\s+/).length ?? 0) / 200));
  const siteUrl = env.SITE_URL.replace(/\/$/, '');
  const canonicalUrl = `${siteUrl}/posts/${post.slug}`;
  const lightningAddress =
    post.lightningAddress ?? env.NOSTRSTACK_LN_ADDRESS ?? env.NEXT_PUBLIC_NOSTRSTACK_LN_ADDRESS ?? null;
  const nostrPubkey = post.nostrPubkey ?? env.NOSTRSTACK_NOSTR_PUBKEY ?? env.NEXT_PUBLIC_NOSTRSTACK_PUBKEY ?? null;
  const nostrRelays =
    post.nostrRelays ??
    parseRelayList(env.NOSTRSTACK_RELAYS ?? env.NEXT_PUBLIC_NOSTRSTACK_RELAYS ?? '');
  const widgetsEnabled = post.nostrstackEnabled !== false;
  const nostrstackBaseUrl = env.NOSTRSTACK_BASE_URL ?? env.NEXT_PUBLIC_NOSTRSTACK_BASE_URL ?? '';
  const nostrstackHost = env.NOSTRSTACK_HOST ?? env.NEXT_PUBLIC_NOSTRSTACK_HOST ?? parseLightningAddress(lightningAddress)?.domain;
  const threadId = `post-${post.slug}`;
  const publishedDate = post.publishDate ?? post.date;
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
    image: [`${canonicalUrl}/og.png`],
    keywords: post.tags ?? [],
    publisher: {
      '@type': 'Organization',
      name: 'klabo.world',
      url: siteUrl,
    },
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute -left-20 -top-10 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-secondary/18 blur-3xl" />
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="relative mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[3fr_1fr]">
          <section className="min-w-0 space-y-8">
            <div className="rounded-3xl border border-border/60 bg-card/80 p-8 shadow-[0_24px_70px_rgba(6,10,20,0.55)]">
              <Link
                href="/posts"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary hover:text-primary/80"
              >
                ← Back to posts
              </Link>
              <div className="mt-4 flex flex-col gap-2">
                <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Published</p>
                <time className="text-base font-semibold text-foreground">
                  {new Date(post.publishDate ?? post.date).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
              </div>
              <h1 className="mt-6 text-4xl font-semibold leading-tight text-foreground md:text-5xl">{post.title}</h1>
              <p className="mt-4 text-lg text-muted-foreground">{post.summary}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {post.tags?.map((tag) => (
                  <Link
                    key={tag}
                    href={`/posts/tag/${encodeURIComponent(tag)}`}
                    className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-foreground transition hover:border-primary/70 hover:bg-primary/15"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-6 text-xs uppercase tracking-[0.35em] text-muted-foreground">
                <span>{readingTime} min read</span>
                <span>
                  {previous ? 'Chronological' : 'Latest'} · {posts.length} post{posts.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>
            {widgetsEnabled && (
              <NostrstackActionBar
                slug={post.slug}
                title={post.title}
                summary={post.summary}
                canonicalUrl={canonicalUrl}
                lightningAddress={lightningAddress}
                nostrPubkey={nostrPubkey ?? undefined}
                relays={nostrRelays}
                baseUrl={nostrstackBaseUrl}
                host={nostrstackHost ?? undefined}
              />
            )}
            <div className="rounded-3xl border border-border/60 bg-card/80 p-8 shadow-[0_24px_70px_rgba(6,10,20,0.55)]">
              <div className="prose max-w-none space-y-8">
                <MDXContent code={post.body.code} />
              </div>
            </div>
            {widgetsEnabled && (
              <NostrstackComments threadId={threadId} canonicalUrl={canonicalUrl} relays={nostrRelays} />
            )}
            <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
              {previous && (
                <Link
                  href={`/posts/${previous.slug}`}
                  className="card-hover-lift rounded-3xl border border-border/60 bg-card/80 p-5"
                >
                  <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Previous</p>
                  <p className="mt-2 text-base font-semibold text-foreground">{previous.title}</p>
                </Link>
              )}
              {next && (
                <Link
                  href={`/posts/${next.slug}`}
                  className="card-hover-lift rounded-3xl border border-border/60 bg-card/80 p-5"
                >
                  <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Next</p>
                  <p className="mt-2 text-base font-semibold text-foreground">{next.title}</p>
                </Link>
              )}
            </div>
          </section>
          <aside className="space-y-6">
            <div className="sticky top-20 space-y-6">
              <div className="space-y-4 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-[0_24px_70px_rgba(6,10,20,0.55)]">
                <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">Post Details</h2>
                <p className="text-sm text-muted-foreground">{post.summary}</p>
                <dl className="space-y-3 text-xs uppercase tracking-[0.35em] text-muted-foreground">
                  <div>
                    <dt className="text-[10px] text-muted-foreground/70">Published</dt>
                    <dd className="text-sm text-foreground">{new Date(post.date).toLocaleDateString()}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-muted-foreground/70">Reading time</dt>
                    <dd className="text-sm text-foreground">{readingTime} mins</dd>
                  </div>
                </dl>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground/70">Quick tags</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {post.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {widgetsEnabled && (
                <NostrstackOmnoster slug={post.slug} canonicalUrl={canonicalUrl} relays={nostrRelays} />
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
