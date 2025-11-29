import Link from 'next/link';
import type { Metadata } from 'next';
import { getContexts, getContextTagCounts } from '@/lib/contexts';

export const metadata: Metadata = {
  title: 'Contexts • klabo.world',
  description: 'Prompt engineering contexts for Claude Code, MCP tools, and AI workflows.',
};

export default function ContextsPage() {
  const contexts = getContexts();
  const tags = Object.entries(getContextTagCounts()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-gray-50 px-6 py-16 dark:bg-gray-950">
      <div className="mx-auto max-w-5xl">
        <header className="mb-12 text-center">
          <p className="text-sm uppercase tracking-widest text-emerald-500">Contexts</p>
          <h1 className="mt-2 text-4xl font-bold">Claude & MCP Context Library</h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Ready-to-use prompts that capture workflows, coding conventions, and domain knowledge for high-leverage AI agents.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {contexts.map((context) => (
            <article
              key={context._id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <p className="text-xs uppercase tracking-widest text-gray-500">
                Updated {new Date(context.updatedDate ?? context.createdDate).toLocaleDateString()}
              </p>
              <h2 className="mt-3 text-2xl font-semibold">
                <Link href={`/contexts/${context.slug}`} className="hover:text-emerald-600 dark:hover:text-emerald-300">
                  {context.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{context.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {context.tags?.map((tag) => (
                  <Link
                    key={tag}
                    href={`/contexts/tag/${encodeURIComponent(tag)}`}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-800/50"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>

        {tags.length > 0 && (
          <section className="mt-16 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Context Tags</h2>
              <Link href="/contexts/tags" className="text-sm font-semibold text-emerald-600 hover:text-emerald-400">
                View all →
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {tags.map(([tag, count]) => (
                <Link
                  key={tag}
                  href={`/contexts/tag/${encodeURIComponent(tag)}`}
                  className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-emerald-400 hover:text-emerald-600 dark:border-gray-700 dark:text-gray-200"
                >
                  {tag} <span className="text-xs text-gray-500">({count})</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
