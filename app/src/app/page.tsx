import Link from 'next/link';
import type { Route } from 'next';
import { getApps } from '@/lib/apps';
import { getContexts } from '@/lib/contexts';
import { getRecentPosts } from '@/lib/posts';
import { getPostTagCloud } from '@/lib/tagCloud';

const heroLinks: { href: Route; label: string }[] = [
  { href: '/posts', label: 'Read Articles' },
  { href: '/apps', label: 'View Apps' },
  { href: '/contexts', label: 'Browse Contexts' },
];

export default function Home() {
  const recentPosts = getRecentPosts(3);
  const apps = getApps();
  const contexts = getContexts();
  const tagCloud = getPostTagCloud(15);

  return (
    <div className="bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <section className="bg-gradient-to-b from-purple-50 to-white px-6 py-16 dark:from-gray-900 dark:to-gray-950">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm uppercase tracking-widest text-indigo-500">klabo.world</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">Bitcoin, Lightning, Nostr & Agentic Engineering</h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-300">
            Deep dives into decentralized protocols, app-building lessons learned, and practical guides for engineers working on Bitcoin, Lightning Network, Nostr, and modern agentic workflows.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {heroLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-500 dark:bg-indigo-500"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-widest text-indigo-500">Latest</p>
              <h2 className="text-3xl font-semibold">Recent Articles</h2>
            </div>
            <Link href="/posts" className="text-sm font-semibold text-indigo-600 hover:text-indigo-400">
              View all posts →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {recentPosts.map((post) => (
              <article key={post._id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <time className="text-sm text-gray-500">
                  {new Date(post.publishDate ?? post.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
                <h3 className="mt-3 text-xl font-semibold">
                  <Link href={`/posts/${post.slug}`} className="hover:text-indigo-600">
                    {post.title}
                  </Link>
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{post.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags?.map((tag) => (
                    <span key={tag} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {apps.length > 0 && (
        <section className="bg-white px-6 py-16 dark:bg-gray-900">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-widest text-purple-500">Apps</p>
                <h2 className="text-3xl font-semibold">Projects & Tools</h2>
              </div>
              <Link href="/apps" className="text-sm font-semibold text-purple-600 hover:text-purple-400">
                View all apps →
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {apps.map((app) => (
                <Link
                  key={app.slug}
                  href={`/apps/${app.slug}`}
                  className="min-w-[260px] flex-1 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-gray-800 dark:bg-gray-950"
                >
                  <div className="flex items-start gap-4">
                    {app.icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={app.icon} alt={app.name} className="h-12 w-12 rounded-xl object-cover" />
                    )}
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-500">{new Date(app.publishDate).toLocaleDateString()}</p>
                      <h3 className="text-lg font-semibold">{app.name}</h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{app.fullDescription}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {contexts.length > 0 && (
        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-widest text-emerald-500">Contexts</p>
                <h2 className="text-3xl font-semibold">AI & MCP Context Library</h2>
              </div>
              <Link href="/contexts" className="text-sm font-semibold text-emerald-600 hover:text-emerald-400">
                Browse contexts →
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {contexts.slice(0, 4).map((context) => (
                <Link key={context._id} href={`/contexts/${context.slug}`} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:-translate-y-1 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-xs uppercase tracking-widest text-gray-500">
                    Updated {new Date(context.updatedDate ?? context.createdDate).toLocaleDateString()}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold">{context.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{context.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {context.tags?.map((tag) => (
                      <span key={tag} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {tagCloud.length > 0 && (
        <section className="bg-white px-6 py-12 dark:bg-gray-900">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-sm uppercase tracking-widest text-gray-500">Popular Topics</p>
            <h2 className="mt-2 text-2xl font-semibold">Tag Cloud</h2>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {tagCloud.map(({ tag, count }) => (
                <Link
                  key={tag}
                  href={`/posts/tag/${encodeURIComponent(tag)}`}
                  className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-600 dark:border-gray-700 dark:text-gray-200"
                >
                  {tag} <span className="text-xs text-gray-500">({count})</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
