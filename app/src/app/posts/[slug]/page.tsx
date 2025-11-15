import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPostBySlug, getPosts } from '@/lib/posts';
import { MDXContent } from '@/components/mdx-content';

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getPosts({ includeUnpublished: true }).map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const post = getPostBySlug(params.slug);
  if (!post) {
    return { title: 'Post not found' };
  }
  return { title: `${post.title} • klabo.world`, description: post.summary };
}

export default function PostPage({ params }: { params: Params }) {
  const post = getPostBySlug(params.slug);
  if (!post) {
    notFound();
  }
  const posts = getPosts();
  const index = posts.findIndex((entry) => entry.slug === post.slug);
  const previous = posts[index - 1];
  const next = posts[index + 1];

  return (
    <article className="bg-gray-50 px-6 py-16 dark:bg-gray-950">
      <div className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs uppercase tracking-widest text-gray-500">
          {new Date(post.publishDate ?? post.date).toLocaleDateString()}
        </p>
        <h1 className="mt-2 text-4xl font-bold">{post.title}</h1>
        <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">{post.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags?.map((tag) => (
            <Link
              key={tag}
              href={`/posts/tag/${encodeURIComponent(tag)}`}
              className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
            >
              {tag}
            </Link>
          ))}
        </div>
        <div className="prose prose-zinc mt-8 max-w-none dark:prose-invert">
          <MDXContent code={post.body.code} />
        </div>
        <div className="mt-12 grid gap-4 border-t border-gray-200 pt-8 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
          {previous && (
            <Link href={`/posts/${previous.slug}`} className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-xs uppercase tracking-widest text-gray-500">Previous</p>
              <p className="font-semibold text-indigo-600">{previous.title}</p>
            </Link>
          )}
          {next && (
            <Link href={`/posts/${next.slug}`} className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-xs uppercase tracking-widest text-gray-500">Next</p>
              <p className="font-semibold text-indigo-600">{next.title}</p>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
