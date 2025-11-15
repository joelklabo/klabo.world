import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getAppBySlug, getApps } from '@/lib/apps';

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getApps().map((app) => ({ slug: app.slug }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const app = getAppBySlug(params.slug);
  if (!app) {
    return { title: 'App not found • klabo.world' };
  }
  return {
    title: `${app.name} • klabo.world`,
    description: app.fullDescription,
  };
}

export default function AppDetailPage({ params }: { params: Params }) {
  const app = getAppBySlug(params.slug);
  if (!app) {
    notFound();
  }

  return (
    <article className="bg-gray-50 px-6 py-16 dark:bg-gray-950">
      <div className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start gap-4">
          {app.icon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={app.icon} alt={app.name} className="h-16 w-16 rounded-2xl object-cover" />
          )}
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500">
              {new Date(app.publishDate).toLocaleDateString()}
            </p>
            <h1 className="text-4xl font-bold">{app.name}</h1>
            <p className="text-sm text-gray-500">Version {app.version}</p>
          </div>
        </div>

        <p className="mt-6 text-lg text-gray-700 dark:text-gray-200">{app.fullDescription}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          {app.appStoreURL && (
            <a
              href={app.appStoreURL}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white"
            >
              View on App Store
            </a>
          )}
          {app.githubURL && (
            <a
              href={app.githubURL}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-800 dark:border-gray-700 dark:text-gray-100"
            >
              View on GitHub
            </a>
          )}
          <Link href="/apps" className="rounded-full border border-transparent px-5 py-2 text-sm font-semibold text-indigo-600 hover:text-indigo-400">
            ← Back to apps
          </Link>
        </div>

        {app.features?.length ? (
          <section className="mt-10">
            <h2 className="text-2xl font-semibold">Key Features</h2>
            <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-200">
              {app.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="text-indigo-500">•</span>
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
                <img key={shot} src={shot} alt={`${app.name} screenshot`} className="rounded-2xl border border-gray-200 dark:border-gray-800" />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </article>
  );
}
