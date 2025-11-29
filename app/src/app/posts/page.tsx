import Link from 'next/link';
import { Metadata } from 'next';
import { getPosts } from '@/lib/posts';

export const metadata: Metadata = {
  title: 'Posts • klabo.world',
};

export default function PostsIndex() {
  const posts = getPosts();

  return (
    <div className="bg-gradient-to-b from-[#0b1020] via-[#0d1428] to-[#0c1326]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14 text-slate-100">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/80">Writing</p>
          <h1 className="text-4xl font-semibold tracking-tight">Posts</h1>
          <p className="max-w-2xl text-sm text-slate-400">
            Long-form guides, experiments, and notes pulled straight from Contentlayer.
          </p>
        </header>
        <ul className="grid gap-5 sm:grid-cols-2">
          {posts.map((post) => (
            <li key={post._id}>
              <Link
                href={`/posts/${post.slug}`}
                className="group block h-full rounded-2xl border border-white/5 bg-white/5 p-5 shadow-[0_20px_50px_rgba(12,19,38,0.35)] transition hover:-translate-y-1 hover:border-amber-200/40 hover:bg-amber-50/5 hover:shadow-[0_24px_60px_rgba(12,19,38,0.5)]"
              >
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                  <span>{new Date(post.publishDate ?? post.date).toLocaleDateString()}</span>
                  <span className="rounded-full bg-amber-200/10 px-2 py-0.5 text-[10px] text-amber-200/90">
                    {post.tags?.[0] ?? 'Post'}
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-semibold leading-snug text-white group-hover:text-amber-100">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm text-slate-300 line-clamp-3">{post.summary}</p>
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.3em] text-amber-200/80">
                    {post.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-amber-200/30 bg-amber-50/5 px-3 py-1 transition group-hover:border-amber-200/60 group-hover:text-amber-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
