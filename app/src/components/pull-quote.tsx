import type { ReactNode } from 'react';

type PullQuoteProps = {
  children: ReactNode;
  author?: string;
  authorUrl?: string;
};

/**
 * PullQuote component for dramatic, attention-grabbing quotes.
 * Use in MDX: <PullQuote author="Name" authorUrl="https://...">Quote text</PullQuote>
 */
export function PullQuote({ children, author, authorUrl }: PullQuoteProps) {
  return (
    <aside className="relative my-12 mx-auto max-w-2xl not-prose">
      {/* Large decorative quotation mark with gradient */}
      <span
        className="absolute -left-6 -top-8 text-[8rem] font-serif leading-none select-none md:-left-12 bg-gradient-to-b from-primary via-primary to-secondary bg-clip-text text-transparent opacity-20"
        aria-hidden="true"
      >
        "
      </span>

      <blockquote className="relative pl-6 md:pl-8 rounded-2xl bg-gradient-to-br from-primary/8 via-transparent to-secondary/5 border border-primary/15 px-6 py-8 md:px-8">
        {/* Accent border - now a vertical bar on left */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-full bg-gradient-to-b from-primary via-primary/80 to-secondary/60" />

        {/* Quote text */}
        <p className="text-xl font-light leading-relaxed text-foreground md:text-2xl lg:text-[1.75rem] relative">{children}</p>

        {/* Attribution */}
        {author && (
          <footer className="mt-6">
            <cite className="not-italic text-sm font-medium text-muted-foreground">
              —{' '}
              {authorUrl ? (
                <a
                  href={authorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors font-semibold"
                >
                  {author}
                </a>
              ) : (
                <span className="font-semibold text-primary/90">{author}</span>
              )}
            </cite>
          </footer>
        )}
      </blockquote>
    </aside>
  );
}
