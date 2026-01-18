'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-[#0b1020] via-[#0d1428] to-[#0c1326] px-6 py-16 text-center font-sans">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-300/80">
            Error
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white text-balance">
            Something went wrong
          </h1>
          <p className="mt-4 max-w-md text-lg text-slate-300">
            An unexpected error occurred. Please try again.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={reset}
              className="rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              Try again
            </button>
          </div>
          {error.digest && (
            <p className="mt-6 text-xs uppercase tracking-[0.3em] text-slate-500">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
