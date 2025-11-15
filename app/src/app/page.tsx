import Link from 'next/link';
import { getApps } from '@/lib/apps';
import { getContexts } from '@/lib/contexts';
import { getDashboards } from '@/lib/dashboards';
import { getRecentPosts } from '@/lib/posts';
import { getPostTagCloud } from '@/lib/tagCloud';

const heroLinks = [
  { href: '/posts', label: 'Read Articles' },
  { href: '/apps', label: 'View Apps' },
  { href: '/contexts', label: 'Browse Contexts' },
];

const heroHighlights = [
  { label: 'Articles', description: 'Deep dives, tutorials, and dispatch notes.', link: '/posts' },
  { label: 'Apps', description: 'Experimental tooling built for Bitcoin + Lightning.', link: '/apps' },
  { label: 'Contexts', description: 'Shared AI contexts and MCP insights.', link: '/contexts' },
];

export default function Home() {
  const recentPosts = getRecentPosts(3);
  const apps = getApps();
  const contexts = getContexts();
  const dashboards = getDashboards();
  const tagCloud = getPostTagCloud(15);

  const stats = [
    { label: 'Articles', value: recentPosts.length },
    { label: 'Apps', value: apps.length },
    { label: 'Contexts', value: contexts.length },
    { label: 'Dashboards', value: dashboards.length },
  ];

  return (
    <div className="bg-slate-950 text-slate-100">
      <section className="relative overflow-hidden rounded-b-[40px] bg-gradient-to-br from-slate-900 via-slate-900 to-[#0d1b22] px-6 py-16 shadow-2xl shadow-black/40">
        <div className="absolute inset-0 opacity-70">
          <div className="pointer-events-none h-full w-full bg-[radial-gradient(circle_at_top,_rgba(93,43,230,0.4),_transparent_40%)]" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.5em] text-indigo-300">klabo.world</p>
            <h1 className="text-4xl font-bold leading-tight text-white drop-shadow-lg md:text-5xl">
              Bitcoin, Lightning, Nostr &amp; Agentic Engineering
            </h1>
            <p className="max-w-2xl text-base text-slate-200/80">
              Tactical walkthroughs, agentic tooling updates, and playable research on decentralized protocols—crafted by the klabo.world team so future engineers can build with confidence.
            </p>
            <div className="flex flex-wrap gap-3">
              {heroLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:translate-y-0.5"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                  <p className="text-3xl font-semibold text-white">{stat.value}</p>
                  <p className="text-xs uppercase tracking-widest text-slate-300">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex w-full flex-1 flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            {heroHighlights.map((highlight) => (
              <Link
                key={highlight.label}
                href={highlight.link}
                className="group rounded-2xl border border-white/5 bg-gradient-to-r from-white/5 to-transparent p-4 transition hover:border-white/30 hover:bg-white/10"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-300">{highlight.label}</p>
                <p className="mt-2 text-base font-semibold text-white">{highlight.description}</p>
                <span className="mt-2 inline-flex text-xs font-semibold text-indigo-300 group-hover:text-indigo-100">
                  Explore →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-widest text-indigo-400">Latest dispatches</p>
              <h2 className="text-3xl font-semibold text-white">Recent Articles</h2>
            </div>
            <Link href="/posts" className="text-sm font-semibold text-indigo-300 transition hover:text-indigo-100">
              View all posts →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {recentPosts.map((post) => (
              <article
                key={post._id}
                className="flex flex-col gap-3 rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-lg shadow-black/40 transition hover:border-indigo-400/50"
              >
                <time className="text-xs uppercase tracking-[0.4em] text-slate-400">
                  {new Date(post.publishDate ?? post.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
                <h3 className="text-xl font-semibold leading-snug text-white">
                  <Link href={`/posts/${post.slug}`} className="hover:text-indigo-300">
                    {post.title}
                  </Link>
                </h3>
                <p className="text-sm text-slate-300">{post.summary}</p>
                <div className="mt-auto flex flex-wrap gap-2">
                  {post.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-800/70 px-3 py-1 text-xs font-medium uppercase tracking-widest text-slate-200"
                    >
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
        <section className="bg-slate-900 px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-widest text-purple-300">Tools</p>
                <h2 className="text-3xl font-semibold text-white">Projects &amp; Experiments</h2>
              </div>
              <Link href="/apps" className="text-sm font-semibold text-purple-200 transition hover:text-purple-100">
                View all apps →
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {apps.map((app) => (
                <Link
                  key={app.slug}
                  href={`/apps/${app.slug}`}
                  className="flex flex-col gap-4 rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl shadow-black/60 transition hover:-translate-y-1 hover:border-purple-400/60"
                >
                  <div className="flex items-center gap-4">
                    {app.icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={app.icon} alt={app.name} className="h-12 w-12 rounded-2xl object-cover" />
                    )}
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-[0.5em] text-slate-400">{new Date(app.publishDate).toLocaleDateString()}</p>
                      <h3 className="text-xl font-semibold text-white">{app.name}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 line-clamp-3">{app.fullDescription}</p>
                  <div className="flex flex-wrap gap-2">
                    {app.features?.slice(0, 3).map((feature) => (
                      <span key={feature} className="rounded-full bg-purple-900/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-purple-100">
                        {feature}
                      </span>
                    ))}
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
            <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-widest text-emerald-300">Contexts</p>
                <h2 className="text-3xl font-semibold text-white">AI &amp; MCP Context Library</h2>
              </div>
              <Link href="/contexts" className="text-sm font-semibold text-emerald-200 transition hover:text-emerald-100">
                Browse contexts →
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {contexts.slice(0, 4).map((context) => (
                <Link
                  key={context._id}
                  href={`/contexts/${context.slug}`}
                  className="flex flex-col gap-4 rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-lg shadow-black/40 transition hover:-translate-y-1 hover:border-emerald-400/70"
                >
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                    Updated {new Date(context.updatedDate ?? context.createdDate).toLocaleDateString()}
                  </p>
                  <h3 className="text-2xl font-semibold text-white">{context.title}</h3>
                  <p className="text-sm text-slate-300">{context.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    {context.tags?.map((tag) => (
                      <span key={tag} className="rounded-full border border-emerald-700/70 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-100">
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

      {dashboards.length > 0 && (
        <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-black px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-widest text-cyan-300">Dashboards</p>
                <h2 className="text-3xl font-semibold text-white">Telemetry & Observability</h2>
              </div>
              <Link
                href="/admin/dashboards"
                className="text-sm font-semibold text-cyan-200 transition hover:text-cyan-100"
              >
                View all dashboards →
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {dashboards.slice(0, 3).map((dashboard) => (
                <Link
                  key={dashboard._id}
                  href={`/admin/dashboards/${dashboard.slug}`}
                  className="flex flex-col gap-3 rounded-3xl border border-slate-800/80 bg-slate-950/60 p-6 shadow-xl shadow-black/60 transition hover:-translate-y-1 hover:border-cyan-500/70"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm uppercase tracking-[0.4em] text-slate-400">{dashboard.panelType}</p>
                    {dashboard.refreshIntervalSeconds ? (
                      <span className="rounded-full border border-cyan-500/60 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-100">
                        {dashboard.refreshIntervalSeconds / 60}m refresh
                      </span>
                    ) : null}
                  </div>
                  <h3 className="text-2xl font-semibold text-white">{dashboard.title}</h3>
                  <p className="text-sm text-slate-300 line-clamp-3">{dashboard.summary}</p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    {dashboard.tags?.map((tag) => (
                      <span key={tag} className="rounded-full border border-cyan-500/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100">
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
        <section className="bg-slate-900 px-6 py-12">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-sm uppercase tracking-widest text-slate-400">Popular Topics</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Tag Cloud</h2>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {tagCloud.map(({ tag, count }) => (
                <Link
                  key={tag}
                  href={`/posts/tag/${encodeURIComponent(tag)}`}
                  className="rounded-full border border-slate-800/80 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-indigo-400 hover:text-indigo-200"
                >
                  {tag} <span className="text-xs text-slate-400">({count})</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
