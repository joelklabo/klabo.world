import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAppBySlug, getApps } from "@/lib/apps";
import { Button } from "@/components/ui/button";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getApps().map((app) => ({ slug: app.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params | Promise<Params>;
}): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const app = getAppBySlug(resolvedParams.slug);
  if (!app) {
    return { title: "App not found" };
  }
  return {
    title: app.name,
    description: app.fullDescription,
  };
}

export default async function AppDetailPage({
  params,
}: {
  params: Params | Promise<Params>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const app = getAppBySlug(resolvedParams.slug);
  if (!app) {
    notFound();
  }

  return (
    <article className="relative min-h-dvh overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute -left-20 -top-10 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-secondary/18 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-3xl border border-border/60 bg-card/80 p-8 shadow-[0_24px_70px_rgba(6,10,20,0.55)]">
          <div className="flex items-start gap-4">
            {app.icon && (
              <Image
                src={app.icon}
                alt=""
                width={64}
                height={64}
                className="size-16 rounded-2xl object-cover"
              />
            )}
            <div>
              <time dateTime={new Date(app.publishDate).toISOString()} className="text-xs uppercase tracking-[0.35em] text-primary">
                {new Date(app.publishDate).toLocaleDateString()}
              </time>
              <h1 className="text-4xl font-bold text-foreground">{app.name}</h1>
              <p className="text-sm text-muted-foreground">Version {app.version}</p>
            </div>
          </div>

          <p className="mt-6 text-lg text-muted-foreground">{app.fullDescription}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            {app.appStoreURL && (
              <Button asChild size="lg">
                <a href={app.appStoreURL} target="_blank" rel="noreferrer">
                  View on App Store
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
              </Button>
            )}
            {app.githubURL && (
              <Button asChild variant="soft" size="lg">
                <a href={app.githubURL} target="_blank" rel="noreferrer">
                  View on GitHub
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
              </Button>
            )}
            <Button asChild variant="outline" size="lg">
              <Link href="/apps">← Back to apps</Link>
            </Button>
          </div>

          {app.features?.length ? (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold">Key Features</h2>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {app.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {app.screenshots?.length ? (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold">Screenshots</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {app.screenshots.map((shot) => (
                  <Image
                    key={shot}
                    src={shot}
                    alt={`${app.name} screenshot`}
                    width={600}
                    height={400}
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="rounded-2xl border border-border/60 shadow-[0_18px_45px_rgba(6,10,20,0.45)]"
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </article>
  );
}
