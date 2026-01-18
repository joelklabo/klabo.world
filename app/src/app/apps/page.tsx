import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getApps } from "@/lib/apps";

export const metadata: Metadata = {
  title: "Apps",
  description:
    "Projects, tools, and experiments built for Bitcoin, Lightning, and Nostr.",
};

export default function AppsPage() {
  const apps = getApps();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute -left-20 -top-10 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-secondary/18 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-6xl px-6 py-16">
        <header className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
            Apps
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance">
            Projects & Experiments
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Native apps, command-line tools, and experiments that support
            Bitcoin, Lightning Network, and Nostr workflows.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          {apps.map((app) => (
            <Link
              key={app.slug}
              href={`/apps/${app.slug}`}
              className="card-hover-lift rounded-2xl border border-border/60 bg-card/80 p-6 shadow-[0_18px_45px_rgba(6,10,20,0.45)]"
            >
              <div className="flex items-start gap-4">
                {app.icon && (
                  <Image
                    src={app.icon}
                    alt={app.name}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                )}
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    {new Date(app.publishDate).toLocaleDateString()}
                  </p>
                  <h2 className="text-2xl font-semibold text-foreground">
                    {app.name}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                    {app.fullDescription}
                  </p>
                  <div className="mt-3 text-xs text-muted-foreground">
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
