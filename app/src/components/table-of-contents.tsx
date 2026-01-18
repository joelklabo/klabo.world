'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Heading } from '@/lib/extract-headings';

type TableOfContentsProps = {
  headings: Heading[];
};

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first heading that is intersecting
        const intersecting = entries.filter((entry) => entry.isIntersecting);
        if (intersecting.length > 0) {
          // Get the one closest to the top
          const closest = intersecting.reduce((prev, curr) => {
            return prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr;
          });
          setActiveId(closest.target.id);
        }
      },
      {
        rootMargin: '-80px 0% -70% 0%',
        threshold: 0,
      }
    );

    // Observe all headings
    for (const { id } of headings) {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Table of contents">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
        On this page
      </p>
      <ul className="space-y-2.5 border-l border-border/30">
        {headings.map(({ id, text, level }, index) => (
          <li key={id}>
            <a
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById(id);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  // Update URL without scroll
                  globalThis.history.pushState(null, '', `#${id}`);
                }
              }}
              className={cn(
                'group flex items-center gap-2.5 py-1.5 text-sm transition-all duration-200',
                level === 2 ? 'pl-4' : 'pl-6',
                activeId === id
                  ? '-ml-px border-l-2 border-primary pl-[calc(1rem-1px)] font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className={cn(
                'inline-flex h-6 w-6 items-center justify-center rounded-sm text-xs font-semibold transition-all duration-200',
                activeId === id
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-110'
                  : 'bg-primary/10 text-primary/70 group-hover:bg-primary/20 group-hover:text-primary group-hover:shadow-sm group-hover:shadow-primary/20'
              )}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="transition-all duration-200 group-hover:translate-x-0.5">
                {text}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

