import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPostBySlug, getPosts } from '@/lib/posts';
import { MDXContent } from '@/components/mdx-content';

type Params = { slug: string };

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
  return { title: `${post.title} • klabo.world`, description: post.summary };
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

  return (
    <div className="bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[3fr_1fr]">
          <section className="space-y-8">
            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(2,6,23,0.7)]">
              <Link
                href="/posts"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-slate-400 hover:text-white"
              >
                ← Back to posts
              </Link>
              <div className="mt-4 flex flex-col gap-2">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Published</p>
                <time className="text-base font-semibold text-white">
                  {new Date(post.publishDate ?? post.date).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
              </div>
              <h1 className="mt-6 text-4xl font-semibold leading-tight text-white md:text-5xl">{post.title}</h1>
              <p className="mt-4 text-lg text-slate-300">{post.summary}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {post.tags?.map((tag) => (
                  <Link
                    key={tag}
                    href={`/posts/tag/${encodeURIComponent(tag)}`}
                    className="rounded-full border border-slate-700/80 bg-slate-900/40 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-300 transition hover:border-indigo-400/60 hover:text-indigo-200"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-6 text-xs uppercase tracking-[0.4em] text-slate-500">
                <span>{readingTime} min read</span>
                <span>
                  {previous ? 'Chronological' : 'Latest'} · {posts.length} post{posts.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900 to-slate-950/80 p-8 shadow-2xl shadow-black/60">
              <div className="prose prose-slate max-w-none space-y-8 dark:prose-invert">
                <MDXContent code={post.body.code} />
              </div>
            </div>
            <div className="grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
              {previous && (
                <Link
                  href={`/posts/${previous.slug}`}
                  className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 transition hover:border-indigo-500/80 hover:bg-slate-900/80"
                >
                  <p className="text-[11px] uppercase tracking-[0.4em] text-slate-500">Previous</p>
                  <p className="mt-2 text-base font-semibold text-white">{previous.title}</p>
                </Link>
              )}
              {next && (
                <Link
                  href={`/posts/${next.slug}`}
                  className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 transition hover:border-indigo-500/80 hover:bg-slate-900/80"
                >
                  <p className="text-[11px] uppercase tracking-[0.4em] text-slate-500">Next</p>
                  <p className="mt-2 text-base font-semibold text-white">{next.title}</p>
                </Link>
              )}
            </div>
          </section>
          <aside className="space-y-6">
            <div className="sticky top-20 space-y-4 rounded-3xl border border-slate-800/90 bg-slate-900/80 p-6 shadow-xl shadow-black/60">
              <h2 className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Post Details</h2>
              <p className="text-sm text-slate-300">{post.summary}</p>
              <dl className="space-y-3 text-xs uppercase tracking-[0.4em] text-slate-400">
                <div>
                  <dt className="text-[10px] text-slate-500">Status</dt>
                  <dd className="text-sm text-white">{post.isPublished ? 'Published' : 'Draft'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-slate-500">Reading time</dt>
                  <dd className="text-sm text-white">{readingTime} mins</dd>
                </div>
              </dl>
              <div>
                <p className="text-[11px] uppercase tracking-[0.4em] text-slate-500">Quick tags</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-700/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
