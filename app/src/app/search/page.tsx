import Link from 'next/link';
import type { Metadata, Route } from 'next';
import { searchContent } from '@/lib/search';

type SearchParams = {
  q?: string | string[];
};

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Search • klabo.world',
  description: 'Search posts, apps, and contexts.',
};

function normalizeParam(value?: string | string[]): string {
  if (!value) return '';
  return Array.isArray(value) ? value[0] ?? '' : value;
}

type SearchPageProps = {
  searchParams?: SearchParams | Promise<SearchParams>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams: SearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const query = normalizeParam(resolvedSearchParams.q).trim();
  const results = query.length >= 2 ? searchContent(query) : [];

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Search</p>
          <h1 className="mt-2 text-4xl font-bold">Find posts, apps, and contexts</h1>
          <p className="mt-2 text-sm text-gray-400">Results update when you submit a query with at least two characters.</p>
        </div>
        <form className="mb-10" action="/search" method="get">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="agents, swift, vicechips..."
            className="w-full rounded-2xl border border-gray-800 bg-gray-900 px-5 py-3 text-lg text-white placeholder-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button className="mt-3 rounded-full bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-500" type="submit">
            Search
          </button>
        </form>
        {query && query.length < 2 && <p className="text-sm text-gray-500">Type at least two characters to search.</p>}
        {query.length >= 2 && (
          <div className="space-y-4">
            {results.length === 0 && <p className="text-sm text-gray-500">No results for “{query}”.</p>}
            {results.map((result) => (
              <Link
                key={`${result.type}-${result.url}`}
                href={result.url as Route}
                className="block rounded-2xl border border-gray-800 bg-gray-900 p-5 hover:border-purple-400"
              >
                <div className="text-xs uppercase tracking-widest text-gray-500">{result.type}</div>
                <h2 className="mt-1 text-2xl font-semibold">{result.title}</h2>
                <p className="mt-2 text-sm text-gray-300">{result.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                  {result.tags.slice(0, 5).map((tag) => (
                    <span key={tag} className="rounded-full border border-gray-800 px-3 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
