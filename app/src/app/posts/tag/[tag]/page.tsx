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
    <div className="bg-gray-50 px-6 py-16 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-widest text-indigo-500">Tag</p>
          <h1 className="mt-2 text-4xl font-bold">{tag}</h1>
          <Link href="/posts/tags" className="text-sm font-semibold text-indigo-600 hover:text-indigo-400">
            ← Back to all tags
          </Link>
        </div>
        <div className="space-y-6">
          {posts.map((post) => (
            <article key={post._id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <time className="text-xs uppercase tracking-widest text-gray-500">
                {new Date(post.publishDate ?? post.date).toLocaleDateString()}
              </time>
              <h2 className="mt-2 text-2xl font-semibold">
                <Link href={`/posts/${post.slug}`} className="hover:text-indigo-600">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{post.summary}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
