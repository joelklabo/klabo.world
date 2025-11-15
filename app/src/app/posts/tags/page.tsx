import Link from 'next/link';
import type { Metadata } from 'next';
import { getPostTagCounts } from '@/lib/posts';

export const metadata: Metadata = {
  title: 'Post tags • klabo.world',
};

export default function PostTagsPage() {
  const tags = Object.entries(getPostTagCounts()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-gray-50 px-6 py-16 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm uppercase tracking-widest text-indigo-500">Tags</p>
        <h1 className="mt-2 text-4xl font-bold">Explore by Topic</h1>
        <div className="mt-8 flex flex-wrap gap-3">
          {tags.map(([tag, count]) => (
            <Link
              key={tag}
              href={`/posts/tag/${encodeURIComponent(tag)}`}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-600 dark:border-gray-700 dark:text-gray-200"
            >
              {tag} <span className="text-xs text-gray-500">({count})</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
