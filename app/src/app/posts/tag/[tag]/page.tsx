import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostTagCounts, getPosts } from '@/lib/posts';

type Params = { tag: string };

export function generateStaticParams(): Params[] {
  return Object.keys(getPostTagCounts()).map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: { params: Params | Promise<Params> }): Promise<Metadata> {
  const { tag: rawTag } = await Promise.resolve(params);
  const tag = decodeURIComponent(rawTag);
  const posts = getPosts().filter((post) => post.tags?.includes(tag));
  if (posts.length === 0) {
    return { title: 'Tag not found • klabo.world' };
  }
  return { title: `${tag} posts • klabo.world` };
}

export default async function PostTagPage({ params }: { params: Params | Promise<Params> }) {
  const { tag: rawTag } = await Promise.resolve(params);
  const tag = decodeURIComponent(rawTag);
  const posts = getPosts().filter((post) => post.tags?.includes(tag));
  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="bg-gradient-to-b from-[#0b1020] via-[#0d1428] to-[#0c1326] text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/80">Tag</p>
            <h1 className="text-4xl font-semibold tracking-tight text-white">{tag}</h1>
            <p className="max-w-2xl text-sm text-slate-400">Posts filed under “{tag}”.</p>
          </div>
          <Link
            href="/posts/tags"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/90 transition hover:-translate-y-0.5 hover:border-amber-200/60 hover:bg-amber-50/5 hover:text-amber-100"
          >
            ← Back to all tags
          </Link>
        </header>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {posts.map((post) => (
            <article
              key={post._id}
              className="group h-full rounded-2xl border border-white/5 bg-white/5 p-5 shadow-[0_20px_50px_rgba(12,19,38,0.35)] transition hover:-translate-y-1 hover:border-amber-200/40 hover:bg-amber-50/5 hover:shadow-[0_24px_60px_rgba(12,19,38,0.5)]"
            >
              <time className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {new Date(post.publishDate ?? post.date).toLocaleDateString()}
              </time>
              <h2 className="mt-3 text-xl font-semibold leading-snug text-white">
                <Link href={`/posts/${post.slug}`} className="hover:text-amber-100">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-slate-300 line-clamp-3">{post.summary}</p>
              {post.tags && post.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.3em] text-amber-200/80">
                  {post.tags.slice(0, 4).map((entry) => (
                    <Link
                      key={entry}
                      href={`/posts/tag/${encodeURIComponent(entry)}`}
                      className="rounded-full border border-amber-200/30 bg-amber-50/5 px-3 py-1 transition group-hover:border-amber-200/60 group-hover:text-amber-100"
                    >
                      {entry}
                    </Link>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
