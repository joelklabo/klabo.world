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
    return { title: "App not found • klabo.world" };
  }
  return {
    title: `${app.name} • klabo.world`,
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
    <article className="bg-linear-to-b from-[#0b1020] via-[#0d1428] to-[#0c1326] text-slate-100">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-3xl border border-white/8 bg-white/5 p-8 shadow-[0_24px_70px_rgba(12,19,38,0.55)]">
          <div className="flex items-start gap-4">
            {app.icon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={app.icon}
                alt={app.name}
                className="h-16 w-16 rounded-2xl object-cover"
              />
            )}
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-amber-200/80">
                {new Date(app.publishDate).toLocaleDateString()}
              </p>
              <h1 className="text-4xl font-semibold text-white">{app.name}</h1>
              <p className="text-sm text-slate-300">Version {app.version}</p>
            </div>
          </div>

          <p className="mt-6 text-lg text-slate-200">{app.fullDescription}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            {app.appStoreURL && (
              <Button asChild size="lg">
                <a href={app.appStoreURL} target="_blank" rel="noreferrer">
                  View on App Store
                </a>
              </Button>
            )}
            {app.githubURL && (
              <Button asChild variant="soft" size="lg">
                <a href={app.githubURL} target="_blank" rel="noreferrer">
                  View on GitHub
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
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                {app.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="text-amber-300">•</span>
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
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={shot}
                    src={shot}
                    alt={`${app.name} screenshot`}
                    className="rounded-2xl border border-white/10 shadow-lg shadow-black/40"
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
