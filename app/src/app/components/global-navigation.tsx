'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { KeyboardEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Posts', href: '/posts' },
  { label: 'Apps', href: '/apps' },
  { label: 'Contexts', href: '/contexts' },
  { label: 'Dashboards', href: '/admin/dashboards' },
  { label: 'Admin', href: '/admin' },
];

const TYPE_LABELS: Record<'post' | 'app' | 'context', string> = {
  post: 'Post',
  app: 'App',
  context: 'Context',
};

type SearchResult = {
  type: 'post' | 'app' | 'context';
  title: string;
  summary: string;
  url: string;
  tags: string[];
};

export function GlobalNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<{ left: number; top: number; width: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const hasQuery = query.trim().length >= 2;
  const showDropdown = hasQuery && isDropdownOpen;

  const updateDropdownPosition = () => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gutter = 8;
    const maxWidth = 720;
    const width = Math.min(rect.width, maxWidth);
    const viewport = window.innerWidth;
    const padding = 12;
    const centeredLeft = rect.left + (rect.width - width) / 2;
    const clampedLeft = Math.max(padding, Math.min(centeredLeft, viewport - width - padding));
    setDropdownStyle({ left: clampedLeft, top: rect.bottom + gutter, width });
  };

  useEffect(() => {
    if (!hasQuery) {
      controllerRef.current?.abort();
      return;
    }

    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;

    fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (res) => {
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          throw new Error(payload?.error ?? `Search returned ${res.status}`);
        }
        return res.json();
      })
      .then((payload: SearchResult[]) => {
        setResults(payload);
        setHighlightedIndex(-1);
        setIsDropdownOpen(true);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError('Unable to search right now');
          setResults([]);
          setIsDropdownOpen(true);
        }
      })
      .finally(() => {
        controllerRef.current = null;
      });
  }, [hasQuery, query]);

  useLayoutEffect(() => {
    if (!showDropdown) return;
    updateDropdownPosition();
    const handle = () => updateDropdownPosition();
    window.addEventListener('resize', handle);
    window.addEventListener('scroll', handle, true);
    return () => {
      window.removeEventListener('resize', handle);
      window.removeEventListener('scroll', handle, true);
    };
  }, [showDropdown]);

  useEffect(() => {
    const listener = (event: MouseEvent) => {
    if (!navRef.current?.contains(event.target as Node)) {
      setIsDropdownOpen(false);
      setHighlightedIndex(-1);
    }
  };
  document.addEventListener('mousedown', listener);
  return () => document.removeEventListener('mousedown', listener);
}, []);

const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown && event.key !== 'Enter') {
      return;
    }

    const hasResults = results.length > 0;
    const lastIndex = results.length - 1;

    if (event.key === 'ArrowDown') {
      if (!hasResults) {
        return;
      }
      event.preventDefault();
      setHighlightedIndex((current) => (current >= lastIndex ? 0 : current + 1));
      setIsDropdownOpen(true);
    } else if (event.key === 'ArrowUp') {
      if (!hasResults) {
        return;
      }
      event.preventDefault();
      setHighlightedIndex((current) => (current <= 0 ? lastIndex : current - 1));
      setIsDropdownOpen(true);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (highlightedIndex >= 0 && results[highlightedIndex]) {
        const target = results[highlightedIndex];
        router.push(target.url as Route);
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        return;
      }
      router.push(`/search?q=${encodeURIComponent(query.trim())}` as Route);
      setIsDropdownOpen(false);
    } else if (event.key === 'Escape') {
      setIsDropdownOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const mobileNavigation = useMemo(
    () =>
      mobileMenuOpen ? (
        <div className="lg:hidden">
          <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/90 px-4 pb-4 shadow-[0_16px_32px_rgba(6,10,20,0.45)]">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href as Route}
                onClick={() => setMobileMenuOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  pathname === item.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null,
    [mobileMenuOpen, pathname],
  );

  const focusedResult = highlightedIndex >= 0 && results[highlightedIndex];

  const isSearching = hasQuery && results.length === 0 && error === null;

  const statusMessage = useMemo(() => {
    if (error) return error;
    if (isSearching) return 'Searching for the right page…';
    if (!results.length) return 'No matching pages found';
    return `${results.length} result${results.length === 1 ? '' : 's'}`;
  }, [error, isSearching, results.length]);

  const handleSelectResult = (result: SearchResult) => {
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
    router.push(result.url as Route);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl shadow-[0_20px_40px_rgba(6,10,20,0.45)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:gap-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-semibold tracking-[0.18em] uppercase text-primary drop-shadow"
            data-testid="global-nav-logo"
          >
            klabo.world
          </Link>
          <button
            type="button"
            className="lg:hidden rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-foreground hover:border-primary/70"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="global-mobile-nav"
          >
            Menu
          </button>
        </div>
        <nav className="hidden items-center gap-5 text-sm font-semibold text-muted-foreground lg:flex" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href as Route}
                className={`rounded-full px-3 py-1 transition hover:text-primary ${
                  isActive ? 'bg-primary/10 text-primary shadow-[0_8px_24px_rgba(255,191,71,0.15)] border border-primary/30' : ''
                }`}
                data-testid={`global-nav-${item.label.toLowerCase()}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex-1" ref={navRef}>
          <label
            className="relative block"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls="global-search-dropdown"
          >
            <span className="sr-only">Search all pages</span>
            <input
              ref={inputRef}
              type="search"
              name="global-search"
              className="w-full rounded-full border border-border/50 bg-card/80 px-4 py-2 text-sm text-foreground shadow-[0_16px_32px_rgba(6,10,20,0.45)] placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Search posts, apps, or contexts…"
              value={query}
              onChange={(event) => {
                const nextValue = event.target.value;
                setQuery(nextValue);
                const trimmed = nextValue.trim();
                if (trimmed.length >= 2) {
                  setIsDropdownOpen(true);
                } else {
                  controllerRef.current?.abort();
                  setResults([]);
                  setHighlightedIndex(-1);
                  setError(null);
                  setIsDropdownOpen(false);
                }
              }}
              onFocus={() => {
                if (hasQuery) {
                  setIsDropdownOpen(true);
                }
              }}
              onKeyDown={handleKeyDown}
              data-testid="global-search-input"
            />
            {showDropdown && (
              <div
                id="global-search-dropdown"
                role="listbox"
                style={dropdownStyle ?? undefined}
                className="fixed z-[120] max-h-80 w-full max-w-[720px] overflow-auto rounded-2xl border border-border/60 bg-card/95 p-4 shadow-[0_28px_70px_rgba(6,10,20,0.6)] ring-1 ring-border/70 backdrop-blur"
                aria-live="polite"
                aria-label="Search suggestions"
                data-testid="global-search-results"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  <span>{statusMessage}</span>
                  <div className="flex flex-wrap items-center gap-1 text-[10px] font-semibold">
                    <span className="rounded-full border border-border/50 bg-background/70 px-2 py-1 text-[10px] tracking-[0.28em]">↑↓</span>
                    <span className="rounded-full border border-border/50 bg-background/70 px-2 py-1 text-[10px] tracking-[0.28em]">Enter</span>
                    <span className="rounded-full border border-border/50 bg-background/70 px-2 py-1 text-[10px] tracking-[0.28em]">Esc</span>
                    {focusedResult ? (
                      <span className="ml-2 text-[10px] tracking-[0.25em] text-primary">{TYPE_LABELS[focusedResult.type]}</span>
                    ) : null}
                  </div>
                </div>
                {isSearching && (
                  <p className="text-sm text-gray-500">Looking for relevant pages…</p>
                )}
                {!isSearching && !results.length && !error && (
                  <p className="text-sm text-muted-foreground">Try another keyword or hit enter to search the site.</p>
                )}
                {error && (
                  <p className="text-sm text-destructive">Search is currently unavailable.</p>
                )}
                <ul className="space-y-2">
                  {results.map((result, index) => {
                    const isActive = highlightedIndex === index;
                    return (
                      <li
                        key={`${result.url}-${result.title}`}
                        role="option"
                        aria-selected={isActive}
                        className={`cursor-pointer rounded-xl border px-3 py-2 text-sm transition ${
                          isActive
                            ? 'border-primary/40 bg-primary/10'
                            : 'border-transparent hover:border-border/50 hover:bg-background/40'
                        }`}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleSelectResult(result);
                        }}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        data-testid="global-search-result"
                      >
                        <p className="font-semibold text-foreground">{result.title}</p>
                        <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{TYPE_LABELS[result.type]}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{result.summary}</p>
                        {result.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.28em] text-primary">
                            {result.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] text-foreground">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {!results.length && (
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                      setIsDropdownOpen(false);
                    }}
                    className="mt-3 text-xs font-semibold uppercase tracking-widest text-indigo-600"
                  >
                    View full search results
                  </button>
                )}
              </div>
            )}
          </label>
        </div>
      </div>
      <div id="global-mobile-nav">{mobileNavigation}</div>
    </header>
  );
}
