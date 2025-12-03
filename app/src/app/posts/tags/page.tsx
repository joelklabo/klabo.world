import Link from "next/link";
import type { Metadata } from "next";
import { getPostTagCounts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Post tags • klabo.world",
};

export default function PostTagsPage() {
  const tags = Object.entries(getPostTagCounts()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-linear-to-b from-[#0b1020] via-[#0d1428] to-[#0c1326] text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/80">
          Tags
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Explore by Topic
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          Quickly jump into the subjects we write about most—Bitcoin, Lightning,
          Nostr, agents, and more.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {tags.map(([tag, count]) => (
            <Link
              key={tag}
              href={`/posts/tag/${encodeURIComponent(tag)}`}
              className="rounded-full border border-amber-200/30 bg-amber-50/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-amber-100 transition hover:-translate-y-0.5 hover:border-amber-200/60 hover:text-amber-50 hover:shadow-[0_12px_28px_rgba(12,19,38,0.4)]"
            >
              {tag}{" "}
              <span className="ml-1 text-xs text-amber-200/70">({count})</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
