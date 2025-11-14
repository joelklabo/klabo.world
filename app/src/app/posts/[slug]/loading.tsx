export default function LoadingPost() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 py-12">
      <div className="h-8 w-1/2 animate-pulse rounded bg-zinc-200" />
      <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-100" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="h-3 w-full animate-pulse rounded bg-zinc-100" />
        ))}
      </div>
    </div>
  );
}
