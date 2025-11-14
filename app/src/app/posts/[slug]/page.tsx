import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getPostBySlug, getPosts } from '@/lib/posts';
import { MDXContent } from '@/components/mdx-content';

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    return { title: 'Post not found' };
  }
  return { title: `${post.title} • klabo.world`, description: post.summary };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
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
