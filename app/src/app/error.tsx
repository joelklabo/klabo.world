'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-linear-to-b from-[#0b1020] via-[#0d1428] to-[#0c1326] px-6 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-300/80">
        Error
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
        Something went wrong
      </h1>
      <p className="mt-4 max-w-md text-lg text-slate-300">
        An unexpected error occurred. Please try again or return to the homepage.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-400"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-amber-200/70 hover:text-amber-100"
        >
          Go home
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 text-xs uppercase tracking-[0.3em] text-slate-500">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
