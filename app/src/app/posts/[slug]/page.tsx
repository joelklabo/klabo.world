import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getPostBySlug, getPosts } from '@/lib/posts';
import { MDXContent } from '@/components/mdx-content';

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPostBySlug(params.slug);
  if (!post) {
    return { title: 'Post not found' };
  }
  return { title: `${post.title} • klabo.world`, description: post.summary };
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) {
    notFound();
  }
  return (
    <article className="prose prose-neutral mx-auto max-w-3xl py-12 dark:prose-invert">
      <h1>{post.title}</h1>
      <p className="text-sm text-zinc-500">{new Date(post.date).toLocaleDateString()}</p>
      <MDXContent code={post.body.code} />
    </article>
  );
}
