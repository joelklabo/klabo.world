import Link from "next/link";
import type { Metadata } from "next";
import { getApps } from "@/lib/apps";

export const metadata: Metadata = {
  title: "Apps • klabo.world",
  description:
    "Projects, tools, and experiments built for Bitcoin, Lightning, and Nostr.",
};

export default function AppsPage() {
  const apps = getApps();

  return (
    <div className="bg-linear-to-b from-[#0b1020] via-[#0d1428] to-[#0c1326] text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <header className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/80">
            Apps
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Projects & Experiments
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            Native apps, command-line tools, and experiments that support
            Bitcoin, Lightning Network, and Nostr workflows.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          {apps.map((app) => (
            <Link
              key={app.slug}
              href={`/apps/${app.slug}`}
              className="rounded-2xl border border-white/8 bg-white/5 p-6 shadow-[0_20px_50px_rgba(12,19,38,0.35)] transition hover:-translate-y-1 hover:border-amber-200/40 hover:bg-amber-50/5 hover:shadow-[0_24px_60px_rgba(12,19,38,0.5)]"
            >
              <div className="flex items-start gap-4">
                {app.icon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={app.icon}
                    alt={app.name}
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                )}
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    {new Date(app.publishDate).toLocaleDateString()}
                  </p>
                  <h2 className="text-2xl font-semibold text-white">
                    {app.name}
                  </h2>
                  <p className="mt-2 text-sm text-slate-300 line-clamp-3">
                    {app.fullDescription}
                  </p>
                  <div className="mt-3 text-xs text-slate-400">
                    Version {app.version}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
