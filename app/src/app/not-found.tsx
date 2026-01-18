import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-linear-to-b from-[#0b1020] via-[#0d1428] to-[#0c1326] px-6 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/80">
        404
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white text-balance">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-lg text-slate-300 text-pretty">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="min-h-11 inline-flex items-center rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-900 motion-safe:transition-colors hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          Go home
        </Link>
        <Link
          href="/posts"
          className="min-h-11 inline-flex items-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white motion-safe:transition-colors hover:border-amber-200/70 hover:text-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          Browse posts
        </Link>
      </div>
    </div>
  );
}
