import Link from 'next/link';
import type { Metadata } from 'next';
import { getApps } from '@/lib/apps';

export const metadata: Metadata = {
  title: 'Apps • klabo.world',
  description: 'Projects, tools, and experiments built for Bitcoin, Lightning, and Nostr.',
};

export default function AppsPage() {
  const apps = getApps();

  return (
    <div className="bg-gray-50 px-6 py-16 dark:bg-gray-950">
      <div className="mx-auto max-w-5xl">
        <header className="mb-12 text-center">
          <p className="text-sm uppercase tracking-widest text-purple-500">Apps</p>
          <h1 className="mt-2 text-4xl font-bold">Projects & Experiments</h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Native apps, command-line tools, and experiments that support Bitcoin, Lightning Network, and Nostr workflows.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          {apps.map((app) => (
            <Link
              key={app.slug}
              href={`/apps/${app.slug}`}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-start gap-4">
                {app.icon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={app.icon} alt={app.name} className="h-14 w-14 rounded-2xl object-cover" />
                )}
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500">
                    {new Date(app.publishDate).toLocaleDateString()}
                  </p>
                  <h2 className="text-2xl font-semibold">{app.name}</h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{app.fullDescription}</p>
                  <div className="mt-3 text-xs text-gray-500">Version {app.version}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
