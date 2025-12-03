import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAppBySlug, getApps } from "@/lib/apps";

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
    <article className="bg-gradient-to-b from-[#0b1020] via-[#0d1428] to-[#0c1326] text-slate-100">
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
              <a
                href={app.appStoreURL}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-gradient-to-r from-amber-500 to-amber-300 px-5 py-2 text-sm font-semibold text-black shadow-md shadow-amber-500/30 transition hover:-translate-y-0.5"
              >
                View on App Store
              </a>
            )}
            {app.githubURL && (
              <a
                href={app.githubURL}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-amber-200/40 px-5 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-200/70 hover:text-white"
              >
                View on GitHub
              </a>
            )}
            <Link
              href="/apps"
              className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-200/60 hover:text-white"
            >
              ← Back to apps
            </Link>
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
