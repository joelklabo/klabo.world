import Link from 'next/link';
import type { Metadata } from 'next';
import { getContextTagCounts } from '@/lib/contexts';

export const metadata: Metadata = {
  title: 'Context tags • klabo.world',
};

export default function ContextTagsPage() {
  const tags = Object.entries(getContextTagCounts()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-gray-50 px-6 py-16 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm uppercase tracking-widest text-emerald-500">Context Tags</p>
        <h1 className="mt-2 text-4xl font-bold">Explore Agentic Contexts by Topic</h1>
        <div className="mt-8 flex flex-wrap gap-3">
          {tags.map(([tag, count]) => (
            <Link
              key={tag}
              href={`/contexts/tag/${encodeURIComponent(tag)}`}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-emerald-300 hover:text-emerald-600 dark:border-gray-700 dark:text-gray-200"
            >
              {tag} <span className="text-xs text-gray-500">({count})</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
