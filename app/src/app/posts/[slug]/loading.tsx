export default function LoadingPost() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-12" role="status" aria-label="Loading post">
      <div className="h-8 w-1/2 animate-pulse rounded-lg bg-muted" />
      <div className="h-4 w-1/3 animate-pulse rounded bg-muted/70" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="h-3 w-full animate-pulse rounded bg-muted/50" />
        ))}
      </div>
      <span className="sr-only">Loading post content...</span>
    </div>
  );
}
