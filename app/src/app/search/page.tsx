import Link from 'next/link';
import type { Metadata, Route } from 'next';
import { searchContent, type SearchResult } from '@/lib/search';
import { Button } from '@/components/ui/button';

type SearchParams = {
  q?: string | string[];
};

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search posts and apps.',
};

function normalizeParam(value?: string | string[]): string {
  if (!value) return '';
  return Array.isArray(value) ? value[0] ?? '' : value;
}

type SearchPageProps = {
  searchParams?: SearchParams | Promise<SearchParams>;
};

function escapeRegExp(value: string) {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\\$&`);
}

function highlightText(text: string, query: string) {
  if (!query) return text;
  const pattern = new RegExp(`(${escapeRegExp(query)})`, 'ig');
  const parts = text.split(pattern);
  return parts.map((part, index) => {
    if (part.toLowerCase() === query.toLowerCase()) {
      return (
        <mark key={`${part}-${index}`} className="rounded bg-primary/20 px-1 py-0.5 text-foreground">
          {part}
        </mark>
      );
    }
    return part;
  });
}

const matchLabels: Record<SearchResult['match'], string> = {
  title: 'Title',
  summary: 'Summary',
  tags: 'Tag',
  body: 'Body',
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams: SearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const query = normalizeParam(resolvedSearchParams.q).trim();
  const results = query.length >= 2 ? searchContent(query) : [];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute -left-20 -top-10 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-secondary/18 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-16 space-y-8">
        <div className="rounded-3xl border border-border/60 bg-card/80 px-6 py-5 shadow-[0_20px_50px_rgba(6,10,20,0.45)]">
          <div className="mb-6 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Search</p>
          <h1 className="text-4xl font-bold leading-tight text-foreground">Find posts and apps</h1>
          <p className="text-sm text-muted-foreground">
            Type two or more characters to see instant results. Use ↑↓ to navigate, Enter to open, Esc to close.
          </p>
          </div>
        <form className="space-y-3" action="/search" method="get">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="agents, swift, vicechips..."
            className="w-full rounded-2xl border border-border/60 bg-card/80 px-5 py-3 text-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-[0_18px_40px_rgba(6,10,20,0.5)]"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg">
              Search
            </Button>
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              <span className="rounded-full border border-border/60 bg-background/80 px-2 py-1">↑↓</span>
              <span className="rounded-full border border-border/60 bg-background/80 px-2 py-1">Enter</span>
              <span className="rounded-full border border-border/60 bg-background/80 px-2 py-1">Esc</span>
            </div>
          </div>
        </form>
        </div>
        {query && query.length < 2 && <p className="text-sm text-muted-foreground">Type at least two characters to search.</p>}
        {query.length >= 2 && (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              {results.length} result{results.length === 1 ? '' : 's'} for “{query}”
            </p>
            {results.length === 0 && <p className="text-sm text-muted-foreground">No results for “{query}”.</p>}
            {results.map((result) => (
              <Link
                key={`${result.type}-${result.url}`}
                href={result.url as Route}
                className="block rounded-2xl border border-border/70 bg-gradient-to-r from-card/90 to-background/80 p-5 shadow-[0_20px_50px_rgba(6,10,20,0.45)] transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_24px_60px_rgba(6,10,20,0.55)]"
              >
                <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
                  <span>{result.type}</span>
                  <span className="rounded-full border border-border/60 bg-background/60 px-2 py-1 text-[10px] tracking-[0.28em]">
                    Match: {matchLabels[result.match]}
                  </span>
                </div>
                <h2 className="mt-1 text-2xl font-semibold text-foreground">
                  {highlightText(result.title, query)}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {highlightText(result.snippet ?? result.summary, query)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.28em] text-primary">
                  {result.tags.slice(0, 5).map((tag) => (
                    <span key={tag} className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-foreground">
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
