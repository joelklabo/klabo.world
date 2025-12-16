import Link from 'next/link';
import { Metadata } from 'next';
import { getPosts } from '@/lib/posts';
import { ViewTransitionLink } from '@/components/view-transition-link';

export const metadata: Metadata = {
  title: 'Posts',
};

export default function PostsIndex() {
  const posts = getPosts();

  return (
    <div className="bg-gradient-to-b from-[#0b1020] via-[#0d1428] to-[#0c1326]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14 text-slate-100">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/80">Writing</p>
            <h1 className="text-4xl font-semibold tracking-tight">Posts</h1>
            <p className="max-w-2xl text-sm text-slate-400">
              Long-form guides, experiments, and notes pulled straight from Contentlayer.
            </p>
          </div>
          <Link
            href="/posts/tags"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/90 transition hover:-translate-y-0.5 hover:border-amber-200/60 hover:bg-amber-50/5 hover:text-amber-100"
          >
            Browse tags →
          </Link>
        </header>
        <ul className="grid gap-5 sm:grid-cols-2">
          {posts.map((post) => (
            <li key={post._id}>
              <article className="group h-full rounded-2xl border border-white/5 bg-white/5 p-5 shadow-[0_20px_50px_rgba(12,19,38,0.35)] transition hover:-translate-y-1 hover:border-amber-200/40 hover:bg-amber-50/5 hover:shadow-[0_24px_60px_rgba(12,19,38,0.5)]">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                  <time>{new Date(post.publishDate ?? post.date).toLocaleDateString()}</time>
                  {post.tags?.[0] ? (
                    <Link
                      href={`/posts/tag/${encodeURIComponent(post.tags[0])}`}
                      className="rounded-full bg-amber-200/10 px-2 py-0.5 text-[10px] text-amber-200/90 transition hover:bg-amber-200/15 hover:text-amber-100"
                    >
                      {post.tags[0]}
                    </Link>
                  ) : (
                    <span className="rounded-full bg-amber-200/10 px-2 py-0.5 text-[10px] text-amber-200/90">
                      Post
                    </span>
                  )}
                </div>
                <h2 className="mt-3 text-xl font-semibold leading-snug text-white">
                  <ViewTransitionLink href={`/posts/${post.slug}`} className="hover:text-amber-100">
                    {post.title}
                  </ViewTransitionLink>
                </h2>
                <p className="mt-2 text-sm text-slate-300 line-clamp-3">{post.summary}</p>
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.3em] text-amber-200/80">
                    {post.tags.slice(0, 4).map((tag) => (
                      <Link
                        key={tag}
                        href={`/posts/tag/${encodeURIComponent(tag)}`}
                        className="rounded-full border border-amber-200/30 bg-amber-50/5 px-3 py-1 transition group-hover:border-amber-200/60 group-hover:text-amber-100"
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
