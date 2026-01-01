'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import SearchResults from './SearchResults';

function normalizeQuery(value: string | null): string {
  return value?.trim() ?? '';
}

export default function SearchPageClient() {
  const searchParams = useSearchParams();
  const query = normalizeQuery(searchParams?.get('q'));

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
        {query.length >= 2 && <SearchResults query={query} />}
      </div>
    </div>
  );
}
