'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { SearchResult } from '@/lib/search';

type SearchResultsProps = {
  query: string;
};

type SearchResponse = {
  results?: SearchResult[];
};

const matchLabels: Record<SearchResult['match'], string> = {
  title: 'Title',
  summary: 'Summary',
  tags: 'Tag',
  body: 'Body',
};

function escapeRegExp(value: string) {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\\$&`);
}

function highlightText(text: string | null | undefined, query: string) {
  const safeText = typeof text === 'string' ? text : '';
  if (!query || safeText.length === 0) return safeText;
  const pattern = new RegExp(`(${escapeRegExp(query)})`, 'ig');
  const parts = safeText.split(pattern);
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

function normalizeResults(results: SearchResult[]) {
  return results.filter(
    (result) =>
      typeof result.url === 'string' &&
      result.url.startsWith('/') &&
      typeof result.title === 'string' &&
      result.title.trim().length > 0,
  );
}

export default function SearchResults({ query }: SearchResultsProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setStatus('idle');
      return;
    }

    const controller = new AbortController();
    setStatus('loading');

    const run = async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          headers: { accept: 'application/json' },
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Search API failed (${response.status})`);
        }
        const data = (await response.json()) as SearchResponse;
        setResults(Array.isArray(data.results) ? data.results : []);
        setStatus('success');
      } catch (error) {
        if ((error as { name?: string }).name === 'AbortError') return;
        console.error('Search API error', { error });
        setResults([]);
        setStatus('error');
      }
    };

    void run();

    return () => {
      controller.abort();
    };
  }, [query]);

  const safeResults = useMemo(() => normalizeResults(results), [results]);

  return (
    <div className="space-y-4">
      {status === 'loading' ? (
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Searching…</p>
      ) : (
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {safeResults.length} result{safeResults.length === 1 ? '' : 's'} for “{query}”
        </p>
      )}

      {status === 'error' && (
        <p className="text-sm text-muted-foreground">Search is temporarily unavailable.</p>
      )}

      {status !== 'loading' && status !== 'error' && safeResults.length === 0 && (
        <p className="text-sm text-muted-foreground">No results for “{query}”.</p>
      )}

      {safeResults.map((result) => (
        <Link
          key={`${result.type}-${result.url}`}
          href={result.url}
          className="block rounded-2xl border border-border/70 bg-gradient-to-r from-card/90 to-background/80 p-5 shadow-[0_20px_50px_rgba(6,10,20,0.45)] transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_24px_60px_rgba(6,10,20,0.55)]"
        >
          <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
            <span>{result.type}</span>
            <span className="rounded-full border border-border/60 bg-background/60 px-2 py-1 text-[10px] tracking-[0.28em]">
              Match: {matchLabels[result.match]}
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-semibold text-foreground">
            {highlightText(result.title ?? '', query)}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {highlightText(result.snippet ?? result.summary ?? '', query)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.28em] text-primary">
            {(result.tags ?? []).slice(0, 5).map((tag) => (
              <span key={tag} className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-foreground">
                {tag}
              </span>
            ))}
          </div>
        </Link>
      ))}
    </div>
  );
}
