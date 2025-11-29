import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getContexts } from '@/lib/contexts';

type Params = { tag: string };

export function generateStaticParams(): Params[] {
  const tags = new Set<string>();
  getContexts().forEach((context) => context.tags?.forEach((tag) => tags.add(tag)));
  return Array.from(tags).map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: { params: Params | Promise<Params> }): Promise<Metadata> {
  const { tag: rawTag } = await Promise.resolve(params);
  const tag = decodeURIComponent(rawTag);
  const tagContexts = getContexts().filter((context) => context.tags?.includes(tag));
  if (tagContexts.length === 0) {
    return { title: 'Context tag not found • klabo.world' };
  }
  return {
    title: `${tag} contexts • klabo.world`,
    description: `Contexts covering ${tag}`,
  };
}

export default async function ContextTagPage({ params }: { params: Params | Promise<Params> }) {
  const { tag: rawTag } = await Promise.resolve(params);
  const tag = decodeURIComponent(rawTag);
  const contexts = getContexts().filter((context) => context.tags?.includes(tag));
  if (contexts.length === 0) {
    notFound();
  }

  return (
    <div className="bg-gray-50 px-6 py-16 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-widest text-gray-500">Context Tag</p>
          <h1 className="mt-2 text-4xl font-bold">{tag}</h1>
          <Link href="/contexts" className="text-sm font-semibold text-emerald-600 hover:text-emerald-400">
            ← Back to all contexts
          </Link>
        </div>
        <div className="space-y-4">
          {contexts.map((context) => (
            <Link key={context._id} href={`/contexts/${context.slug}`} className="block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:-translate-y-1 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs uppercase tracking-widest text-gray-500">
                Updated {new Date(context.updatedDate ?? context.createdDate).toLocaleDateString()}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">{context.title}</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{context.summary}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
