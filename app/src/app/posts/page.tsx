import Link from 'next/link';
import { Metadata } from 'next';
import { getPosts } from '@/lib/posts';

export const metadata: Metadata = {
  title: 'Posts • klabo.world',
};

export default function PostsIndex() {
  const posts = getPosts();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-12">
      <header>
        <h1 className="text-4xl font-semibold">Posts</h1>
        <p className="text-sm text-zinc-500">Long-form writing sourced from Contentlayer.</p>
      </header>
      <ul className="flex flex-col divide-y divide-zinc-200">
        {posts.map((post) => (
          <li key={post._id} className="py-4">
            <Link href={`/posts/${post.slug}`} className="text-xl font-medium text-blue-600">
              {post.title}
            </Link>
            <p className="text-sm text-zinc-500">{post.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
