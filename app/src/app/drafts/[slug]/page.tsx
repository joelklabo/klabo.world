import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { formatPostDate, getPostBySlug } from '@/lib/posts';
import { MDXContent } from '@/components/mdx-content';
import { requireAdminSession } from '@/lib/adminSession';
import { ReadingProgress } from '@/components/reading-progress';
import { TableOfContents } from '@/components/table-of-contents';
import { extractHeadings } from '@/lib/extract-headings';
import { AnnotatableDraft } from '@/components/annotations';

type Params = { slug: string };
type SearchParams = { variant?: string; layout?: string; annotate?: string };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Params | Promise<Params> }): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params as Params);
  const post = getPostBySlug(resolvedParams.slug);
  if (!post) {
    return { title: 'Draft not found' };
  }

  return {
    title: `[DRAFT] ${post.title}`,
    description: post.summary,
    robots: { index: false, follow: false },
  };
}

export default async function DraftPreviewPage({
  params,
  searchParams,
}: {
  params: Params | Promise<Params>;
  searchParams: SearchParams | Promise<SearchParams>;
}) {
  await requireAdminSession();

  const resolvedParams = await Promise.resolve(params as Params);
  const resolvedSearchParams = await Promise.resolve(searchParams as SearchParams);
  const requestedSlug = resolvedParams.slug;
  const variant = resolvedSearchParams.variant || 'b'; // Default to variant B
  const layout = resolvedSearchParams.layout || '1'; // Default to layout 1
  const annotateMode = resolvedSearchParams.annotate === 'true';
  const post = getPostBySlug(requestedSlug);

  if (!post) {
    notFound();
  }

  if (post.status !== 'draft') {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-2xl rounded-lg border border-blue-500/30 bg-blue-500/10 p-6">
          <h1 className="text-xl font-semibold text-blue-100">This post is published</h1>
          <p className="mt-2 text-blue-200">
            This post has already been published. View it at{' '}
            <Link href={`/posts/${post.slug}`} className="underline hover:text-white rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50">
              /posts/{post.slug}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const rawBody = post.body?.raw;
  const bodyCode = post.body?.code;
  if (!rawBody || !bodyCode) {
    notFound();
  }

  const readingTime = Math.max(1, Math.round(rawBody.split(/\s+/).length / 200));
  const headings = extractHeadings(rawBody);

  const proseClass = `prose max-w-none ${
    variant === 'a' ? 'prose-variant-a' :
    variant === 'b' ? 'prose-variant-b' :
    variant === 'c' ? 'prose-variant-c' :
    'prose-variant-b'
  }`;

  // Shared components
  const DraftBanner = (
    <div className="sticky top-14 z-40 border-b border-amber-500/30 bg-amber-900/90 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded bg-amber-500/20 px-2 py-1 text-xs font-bold uppercase tracking-wider text-amber-200">
            {annotateMode ? 'Annotation Mode' : 'Draft Preview'}
          </span>
          <span className="hidden text-sm text-amber-100/80 sm:inline">
            {annotateMode ? 'Add feedback to this draft' : `Layout ${layout} · This post is not published.`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {annotateMode ? (
            <Link
              href={`/drafts/${post.slug}?layout=${layout}`}
              className="rounded bg-amber-500/20 px-3 py-1.5 text-sm font-medium text-amber-100 hover:bg-amber-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
            >
              Exit Annotations
            </Link>
          ) : (
            <>
              <Link
                href={`/drafts/${post.slug}?annotate=true`}
                className="rounded bg-blue-500/20 px-3 py-1.5 text-sm font-medium text-blue-100 hover:bg-blue-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50"
              >
                <span aria-hidden="true">📝 </span>Annotate
              </Link>
              <Link
                href={`/admin/posts/${post.slug}/edit`}
                className="rounded bg-amber-500/20 px-3 py-1.5 text-sm font-medium text-amber-100 hover:bg-amber-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
              >
                Edit Draft
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const BackgroundOrbs = (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-32 -top-20 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute right-0 top-20 h-[28rem] w-[28rem] rounded-full bg-secondary/15 blur-[140px]" />
      <div className="absolute left-1/3 top-1/2 h-80 w-80 rounded-full bg-primary/10 blur-[100px]" />
    </div>
  );

  const Sidebar = (
    <aside className="hidden lg:block">
      <div className="sticky top-32 space-y-6">
        {headings.length > 0 && (
          <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-card/90 to-card/70 p-5 shadow-[0_20px_50px_rgba(6,10,20,0.45)]">
            <TableOfContents headings={headings} />
          </div>
        )}
        <div className="space-y-4 rounded-2xl border border-border/60 bg-gradient-to-b from-card/90 to-card/70 p-5 shadow-[0_20px_50px_rgba(6,10,20,0.45)]">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Details</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Status</dt>
              <dd className="mt-0.5 text-sm font-semibold text-amber-400">Draft</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Reading time</dt>
              <dd className="mt-0.5 text-sm text-foreground">{readingTime} mins</dd>
            </div>
          </dl>
        </div>
      </div>
    </aside>
  );

  const Tags = post.tags && post.tags.length > 0 && (
    <div className="flex flex-wrap gap-2">
      {post.tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-foreground"
        >
          {tag}
        </span>
      ))}
    </div>
  );

  // ANNOTATION MODE: Simplified layout with annotation system
  if (annotateMode) {
    return (
      <AnnotatableDraft draftSlug={post.slug}>
        <div className="relative min-h-screen bg-background text-foreground">
          {DraftBanner}
          {BackgroundOrbs}

          <article className="relative mx-auto max-w-4xl px-6 py-12">
            {/* Simplified header */}
            <header className="mb-8">
              <Link
                href="/posts"
                className="text-xs font-semibold uppercase tracking-[0.35em] text-primary hover:text-primary/80"
              >
                ← All posts
              </Link>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-5xl">
                {post.title}
              </h1>
              <p className="mt-4 text-xl leading-relaxed text-muted-foreground">{post.summary}</p>
              {Tags && <div className="mt-6">{Tags}</div>}
            </header>

            {/* Content Card */}
            <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-card/90 to-card/70 p-8 shadow-[0_24px_70px_rgba(6,10,20,0.55)] md:p-10">
              <div className={proseClass}>
                <MDXContent code={bodyCode} />
              </div>
            </div>
          </article>
        </div>
      </AnnotatableDraft>
    );
  }

  // LAYOUT 1: Full-width gradient header with small diagram accent
  if (layout === '1') {
    return (
      <div className="relative min-h-screen bg-background text-foreground">
        <ReadingProgress />
        {DraftBanner}
        {BackgroundOrbs}

        <article className="relative">
          {/* Gradient header with floating diagram */}
          <div className="relative w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16">
            <div className="mx-auto max-w-6xl px-6">
              <div className="flex items-center justify-between gap-8">
                <div className="max-w-2xl">
                  <Link
                    href="/posts"
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary transition-colors hover:text-primary/80"
                  >
                    ← All posts
                  </Link>
                  <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-[3.5rem]">
                    {post.title}
                  </h1>
                  <p className="mt-4 text-xl leading-relaxed text-muted-foreground">{post.summary}</p>
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    {Tags}
                    <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{readingTime} min read</span>
                  </div>
                </div>
                {/* Small diagram accent - cropped to show only diagram */}
                {post.featuredImage && (
                  <div className="hidden shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-2xl lg:block lg:w-64">
                    <div className="aspect-square relative">
                      <Image
                        src={post.featuredImage}
                        alt=""
                        fill
                        className="object-cover object-[100%_center] scale-150"
                        priority
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="grid gap-12 lg:grid-cols-[1fr_280px]">
              <section className="min-w-0">
                {/* Content */}
                <div className="rounded-3xl border border-border/60 bg-gradient-to-b from-card/90 to-card/70 p-8 shadow-[0_24px_70px_rgba(6,10,20,0.55)] md:p-10 lg:p-12">
                  <div className={proseClass}>
                    <MDXContent code={bodyCode} />
                  </div>
                </div>
              </section>
              {Sidebar}
            </div>
          </div>
        </article>
      </div>
    );
  }

  // LAYOUT 2: Clean editorial - no hero image, pure typography
  if (layout === '2') {
    return (
      <div className="relative min-h-screen bg-background text-foreground">
        <ReadingProgress />
        {DraftBanner}
        {BackgroundOrbs}

        <article className="relative mx-auto max-w-6xl px-6 py-12">
          {/* Editorial header - clean typography, no image */}
          <header className="mb-12 max-w-3xl">
            <Link
              href="/posts"
              className="text-xs font-semibold uppercase tracking-[0.35em] text-primary hover:text-primary/80"
            >
              ← All posts
            </Link>
            <h1 className="mt-8 text-5xl font-semibold leading-[1.08] tracking-tight text-foreground md:text-6xl lg:text-7xl">
              {post.title}
            </h1>
            <p className="mt-6 text-xl leading-relaxed text-muted-foreground md:text-2xl">{post.summary}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-border/40 pt-6">
              {Tags}
              <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{readingTime} min read</span>
              <time className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {formatPostDate(post.date, { month: 'short', day: 'numeric', year: 'numeric' })}
              </time>
            </div>
          </header>

          <div className="grid gap-12 lg:grid-cols-[1fr_280px]">
            <section className="min-w-0">
              {/* Content Card - Title comes from MDX */}
              <div className="rounded-3xl border border-border/60 bg-gradient-to-b from-card/90 to-card/70 p-8 shadow-[0_24px_70px_rgba(6,10,20,0.55)] md:p-10 lg:p-12">
                <div className={proseClass}>
                  <MDXContent code={bodyCode} />
                </div>
              </div>
            </section>
            {Sidebar}
          </div>
        </article>
      </div>
    );
  }

  // LAYOUT 3: Narrow cinematic strip showing just the diagram
  if (layout === '3') {
    return (
      <div className="relative min-h-screen bg-background text-foreground">
        <ReadingProgress />
        {DraftBanner}
        {BackgroundOrbs}

        <article className="relative">
          {/* Header */}
          <div className="mx-auto max-w-6xl px-6 pt-12">
            <header className="mb-8">
              <Link
                href="/posts"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary transition-colors hover:text-primary/80"
              >
                ← All posts
              </Link>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-[3.5rem]">
                {post.title}
              </h1>
              <p className="mt-4 text-xl leading-relaxed text-muted-foreground">{post.summary}</p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                {Tags}
                <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{readingTime} min</span>
              </div>
            </header>
          </div>

          {/* Narrow cinematic strip - diagram only */}
          {post.featuredImage && (
            <div className="relative w-full overflow-hidden">
              <div className="h-32 relative md:h-40">
                <Image
                  src={post.featuredImage}
                  alt=""
                  fill
                  className="object-cover object-[100%_center] scale-[2]"
                  priority
                />
              </div>
            </div>
          )}

          <div className="grid gap-12 lg:grid-cols-[1fr_280px]">
            <section className="min-w-0">
              <div className="rounded-3xl border border-border/60 bg-gradient-to-b from-card/90 to-card/70 p-8 shadow-[0_24px_70px_rgba(6,10,20,0.55)] md:p-10 lg:p-12">
                <div className={proseClass}>
                  <MDXContent code={bodyCode} />
                </div>
              </div>
            </section>
            {Sidebar}
          </div>
        </article>
      </div>
    );
  }

  // LAYOUT 4: Card-based with large circular diagram accent
  if (layout === '4') {
    return (
      <div className="relative min-h-screen bg-background text-foreground">
        <ReadingProgress />
        {DraftBanner}
        {BackgroundOrbs}

        <article className="relative mx-auto max-w-6xl px-6 py-12">
          {/* Card header with large circular diagram */}
          <header className="mb-12 rounded-3xl border border-border/60 bg-gradient-to-b from-card/90 to-card/70 p-8 shadow-[0_24px_70px_rgba(6,10,20,0.55)] md:p-10 lg:p-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
              <div className="flex-1">
                <Link
                  href="/posts"
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary transition-colors hover:text-primary/80"
                >
                  ← All posts
                </Link>
                <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-[3.5rem]">
                  {post.title}
                </h1>
                <p className="mt-4 text-xl leading-relaxed text-muted-foreground">{post.summary}</p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  {Tags}
                  <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{readingTime} min</span>
                </div>
              </div>
              {/* Large circular diagram */}
              {post.featuredImage && (
                <div className="relative mx-auto h-64 w-64 shrink-0 overflow-hidden rounded-full border-2 border-primary/30 shadow-[0_0_80px_rgba(217,119,6,0.25)] lg:h-80 lg:w-80">
                  <Image
                    src={post.featuredImage}
                    alt=""
                    fill
                    className="object-cover object-[100%_center] scale-[2.5]"
                    priority
                  />
                </div>
              )}
            </div>
          </header>

          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="grid gap-12 lg:grid-cols-[1fr_280px]">
              <section className="min-w-0">
                <div className="rounded-3xl border border-border/60 bg-gradient-to-b from-card/90 to-card/70 p-8 shadow-[0_24px_70px_rgba(6,10,20,0.55)] md:p-10 lg:p-12">
                  <div className={`${proseClass} prose-no-title`}>
                    <MDXContent code={bodyCode} />
                  </div>
                </div>
              </section>
              {Sidebar}
            </div>
          </div>
        </article>
      </div>
    );
  }

  // LAYOUT 5: Diagram as background pattern behind title
  if (layout === '5') {
    return (
      <div className="relative min-h-screen bg-background text-foreground">
        <ReadingProgress />
        {DraftBanner}
        {BackgroundOrbs}

        <article className="relative">
          {/* Header with diagram as subtle background */}
          <header className="relative overflow-hidden border-b border-border/40 py-16">
            {/* Diagram as background pattern */}
            {post.featuredImage && (
              <div className="absolute inset-0 opacity-10">
                <Image
                  src={post.featuredImage}
                  alt=""
                  fill
                  className="object-cover object-[100%_center] scale-150"
                  priority
                />
              </div>
            )}
            <div className="relative mx-auto max-w-6xl px-6">
              <Link
                href="/posts"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary transition-colors hover:text-primary/80"
              >
                ← All posts
              </Link>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-[3.5rem]">
                {post.title}
              </h1>
              <p className="mt-4 max-w-2xl text-xl leading-relaxed text-muted-foreground">{post.summary}</p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                {Tags}
                <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{readingTime} min read</span>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="grid gap-12 lg:grid-cols-[1fr_280px]">
              <section className="min-w-0">
                <div className="rounded-3xl border border-border/60 bg-gradient-to-b from-card/90 to-card/70 p-8 shadow-[0_24px_70px_rgba(6,10,20,0.55)] md:p-10 lg:p-12">
                  <div className={proseClass}>
                    <MDXContent code={bodyCode} />
                  </div>
                </div>
              </section>
              {Sidebar}
            </div>
          </div>
        </article>
      </div>
    );
  }

  // Default fallback to layout 1
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <ReadingProgress />
      {DraftBanner}
      {BackgroundOrbs}
      <div className="mx-auto max-w-6xl px-6 py-12">
        <p>Unknown layout. Use ?layout=1 through ?layout=5</p>
      </div>
    </div>
  );
}
