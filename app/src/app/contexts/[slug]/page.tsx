import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXContent } from '@/components/mdx-content';
import { getContextBySlug, getContexts } from '@/lib/contexts';

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getContexts({ includeDrafts: true }).map((context) => ({ slug: context.slug }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const context = getContextBySlug(params.slug);
  if (!context) {
    return { title: 'Context not found • klabo.world' };
  }
  return {
    title: `${context.title} • Context`,
    description: context.summary,
  };
}

export default function ContextDetailPage({ params }: { params: Params }) {
  const context = getContextBySlug(params.slug);
  if (!context) {
    notFound();
  }

  return (
    <article className="bg-gray-50 px-6 py-16 dark:bg-gray-950">
      <div className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs uppercase tracking-widest text-gray-500">
          Updated {new Date(context.updatedDate ?? context.createdDate).toLocaleDateString()}
        </p>
        <h1 className="mt-2 text-4xl font-bold">{context.title}</h1>
        <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">{context.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {context.tags?.map((tag) => (
            <span key={tag} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100">
              {tag}
            </span>
          ))}
        </div>
        <div className="prose prose-zinc mt-8 dark:prose-invert">
          <MDXContent code={context.body.code} />
        </div>
      </div>
    </article>
  );
}
