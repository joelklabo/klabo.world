'use client';

import Link from 'next/link';

export default function PostError(props: { error: Error; reset: () => void }) {
  const { reset } = props;
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute -left-20 -top-10 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-secondary/18 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-border/60 bg-card/80 p-8 shadow-[0_24px_70px_rgba(6,10,20,0.55)]">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">Post error</p>
          <h1 className="mt-4 text-2xl font-semibold text-foreground">This post failed to load.</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Try again, or head back to the posts index while we refresh the content.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-full border border-primary/40 bg-primary/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-foreground transition hover:border-primary/70 hover:bg-primary/15"
            >
              Try again
            </button>
            <Link
              href="/posts"
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-foreground transition hover:border-white/30 hover:bg-white/10"
            >
              Browse posts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
