'use client';

import Link from 'next/link';
import type { Route } from 'next';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const links = [
    { label: 'Writing', href: '/posts' as Route },
    { label: 'Projects', href: '/projects' as Route },
    { label: 'Search', href: '/search' as Route },
  ];

  const socialLinks = [
    { label: 'GitHub', href: 'https://github.com/klabo', title: 'GitHub' },
    { label: 'Twitter', href: 'https://twitter.com/klabo', title: 'Twitter / X' },
  ];

  return (
    <footer className="relative mt-20 border-t border-border/30 bg-gradient-to-b from-background via-background to-background/95">
      {/* Accent gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {/* Brand & Description */}
          <div className="space-y-4">
            <Link
              href="/"
              className="text-lg font-semibold tracking-[0.18em] uppercase text-primary hover:text-primary/80 motion-safe:transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              klabo.world
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
              Bitcoin, Lightning & agentic engineering. Tutorials, project updates, and AI context libraries.
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-4" aria-label="Footer navigation">
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/70">Navigate</h2>
            <ul className="space-y-2.5">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-block text-sm text-muted-foreground hover:text-primary motion-safe:transition-colors motion-safe:duration-150 relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded"
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-0 w-0 h-px bg-gradient-to-r from-primary to-primary/40 group-hover:w-full motion-safe:transition-[width] motion-safe:duration-300" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Social Links */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/70">Connect</h2>
            <ul className="flex flex-wrap gap-3" role="list">
              {socialLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.title}
                    className="inline-flex items-center justify-center size-11 min-h-11 min-w-11 rounded-full border border-border/40 bg-card/30 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 motion-safe:transition-colors motion-safe:duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  >
                    {link.label === 'GitHub' && (
                      <svg className="size-4 motion-safe:group-hover:scale-110 motion-safe:transition-transform motion-safe:duration-200" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                    )}
                    {link.label === 'Twitter' && (
                      <svg className="size-4 motion-safe:group-hover:scale-110 motion-safe:transition-transform motion-safe:duration-200" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="my-12 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />

        {/* Copyright & Meta */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground/60 tracking-[0.15em] uppercase">
            &copy; {currentYear} klabo.world. all rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground/60 uppercase tracking-[0.15em]">
            <Link
              href="/posts"
              className="hover:text-primary motion-safe:transition-colors motion-safe:duration-150 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              Blog
            </Link>
            <span className="text-border/40">·</span>
            <Link
              href="/projects"
              className="hover:text-primary motion-safe:transition-colors motion-safe:duration-150 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              Projects
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
