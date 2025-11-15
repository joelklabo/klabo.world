import { allContextDocs, type ContextDoc } from 'contentlayer/generated';

function isPublished(context: ContextDoc): boolean {
  return context.isPublished !== false;
}

export function getContexts(options: { includeDrafts?: boolean } = {}): ContextDoc[] {
  return [...allContextDocs]
    .filter((context) => options.includeDrafts || isPublished(context))
    .sort((a, b) => new Date(b.updatedDate ?? b.createdDate).getTime() - new Date(a.updatedDate ?? a.createdDate).getTime());
}

export function getContextBySlug(slug: string): ContextDoc | undefined {
  return allContextDocs.find((context) => context.slug === slug);
}

export function getContextTagCounts(): Record<string, number> {
  return getContexts().reduce<Record<string, number>>((acc, context) => {
    context.tags?.forEach((tag) => {
      const normalized = tag.trim();
      acc[normalized] = (acc[normalized] ?? 0) + 1;
    });
    return acc;
  }, {});
}
