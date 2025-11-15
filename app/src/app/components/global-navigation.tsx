'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';

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

  const inputRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const hasQuery = query.trim().length >= 2;
  const showDropdown = hasQuery && isDropdownOpen;

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
        router.push(target.url);
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        return;
      }
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
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
          <div className="flex flex-col gap-2 px-4 pb-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm font-semibold ${
                  pathname === item.href ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'
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
    router.push(result.url);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:gap-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold tracking-tight text-gray-900" data-testid="global-nav-logo">
            klabo.world
          </Link>
          <button
            type="button"
            className="lg:hidden text-sm font-medium text-gray-600"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="global-mobile-nav"
          >
            Menu
          </button>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-gray-600 lg:flex" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors hover:text-gray-900 ${isActive ? 'text-gray-900' : ''}`}
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
              className="w-full rounded-full border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    setLoading(false);
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
                className="mt-2 max-h-72 overflow-auto rounded-2xl border border-gray-200 bg-white p-3 shadow-lg shadow-black/5"
                aria-live="polite"
                aria-label="Search suggestions"
                data-testid="global-search-results"
              >
                <div className="mb-2 flex items-center justify-between text-xs uppercase text-gray-500">
                  <span>{statusMessage}</span>
                  <span>{focusedResult ? TYPE_LABELS[focusedResult.type] : ''}</span>
                </div>
                {isSearching && (
                  <p className="text-sm text-gray-500">Looking for relevant pages…</p>
                )}
                {!isSearching && !results.length && !error && (
                  <p className="text-sm text-gray-500">Try another keyword or hit enter to search the site.</p>
                )}
                {error && (
                  <p className="text-sm text-red-600">Search is currently unavailable.</p>
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
                          isActive ? 'border-indigo-500 bg-indigo-50' : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                        }`}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleSelectResult(result);
                        }}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        data-testid="global-search-result"
                      >
                        <p className="font-semibold text-gray-900">{result.title}</p>
                        <p className="text-xs uppercase text-gray-500">{TYPE_LABELS[result.type]}</p>
                        <p className="text-sm text-gray-500 line-clamp-2">{result.summary}</p>
                        {result.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider text-indigo-500">
                            {result.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="rounded-full border border-indigo-100 px-2 py-0.5 text-[10px]">
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
