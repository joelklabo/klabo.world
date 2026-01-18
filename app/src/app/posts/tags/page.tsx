import Link from "next/link";
import type { Metadata } from "next";
import { getPostTagCounts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Post tags",
};

export default function PostTagsPage() {
  const tags = Object.entries(getPostTagCounts()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute -left-20 -top-10 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-secondary/18 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-6xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Tags</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance">Explore by Topic</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Quickly jump into the subjects we write about most—Bitcoin, Lightning,
          Nostr, agents, and more.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {tags.map(([tag, count]) => (
            <Link
              key={tag}
              href={`/posts/tag/${encodeURIComponent(tag)}`}
              className="rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-foreground transition-colors hover:border-primary/60 hover:bg-primary/15 motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_12px_28px_rgba(6,10,20,0.4)]"
            >
              {tag} <span className="ml-1 text-xs text-muted-foreground">({count})</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
