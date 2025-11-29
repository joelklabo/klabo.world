import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { allContextDocs, type ContextDoc } from 'contentlayer/generated';
import { getContextsDirectory } from './contextPersistence';

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

export type ContextMetadataDTO = {
  title: string;
  summary: string;
  tags: string[];
  slug: string;
  createdDate: string;
  updatedDate: string;
  isPublished: boolean;
};

export type AdminContext = ContextMetadataDTO & {
  body: string;
};

export function toContextMetadata(context: ContextDoc): ContextMetadataDTO {
  const createdISO = new Date(context.createdDate).toISOString();
  const updatedISO = new Date(context.updatedDate ?? context.createdDate).toISOString();
  return {
    title: context.title,
    summary: context.summary,
    tags: context.tags ?? [],
    slug: context.slug,
    createdDate: createdISO,
    updatedDate: updatedISO,
    isPublished: isPublished(context),
  };
}

export function toAdminContextMetadata(context: AdminContext): ContextMetadataDTO {
  const createdISO = new Date(context.createdDate).toISOString();
  const updatedISO = new Date(context.updatedDate ?? context.createdDate).toISOString();
  return {
    title: context.title,
    summary: context.summary,
    tags: context.tags ?? [],
    slug: context.slug,
    createdDate: createdISO,
    updatedDate: updatedISO,
    isPublished: context.isPublished !== false,
  };
}

export function getPublishedContextBySlug(slug: string): ContextDoc | undefined {
  const context = getContextBySlug(slug);
  if (!context || !isPublished(context)) {
    return undefined;
  }
  return context;
}

export function searchPublishedContexts(term: string): ContextDoc[] {
  const normalized = term.trim().toLowerCase();
  if (normalized.length < 2) {
    return [];
  }
  return getContexts()
    .filter((context) => {
      if (context.title.toLowerCase().includes(normalized)) {
        return true;
      }
      if (context.summary.toLowerCase().includes(normalized)) {
        return true;
      }
      if (context.tags?.some((tag) => tag.toLowerCase().includes(normalized))) {
        return true;
      }
      return false;
    })
    .slice(0, 10);
}

async function readDiskContexts(exclude: Set<string>, includeDrafts: boolean): Promise<AdminContext[]> {
  const dir = getContextsDirectory();
  try {
    const files = await fs.readdir(dir);
    const contexts: AdminContext[] = [];
    for (const file of files) {
      if (!file.endsWith('.mdx')) continue;
      const slug = path.basename(file, '.mdx');
      if (exclude.has(slug)) continue;
      const raw = await fs.readFile(path.join(dir, file), 'utf8');
      const parsed = matter(raw);
      const data = parsed.data as Record<string, unknown>;
      const isPublishedFlag = data.isPublished !== false;
      if (!includeDrafts && !isPublishedFlag) {
        continue;
      }
      contexts.push({
        title: typeof data.title === 'string' ? data.title : slug,
        summary: typeof data.summary === 'string' ? data.summary : '',
        tags: Array.isArray(data.tags) ? data.tags.map((tag) => String(tag)) : [],
        slug,
        createdDate: typeof data.createdDate === 'string' ? data.createdDate : new Date().toISOString(),
        updatedDate: typeof data.updatedDate === 'string' ? data.updatedDate : typeof data.createdDate === 'string' ? data.createdDate : new Date().toISOString(),
        isPublished: isPublishedFlag,
        body: parsed.content.trim(),
      });
    }
    return contexts;
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function getContextsForAdmin(options: { includeDrafts?: boolean } = {}): Promise<AdminContext[]> {
  const includeDrafts = Boolean(options.includeDrafts);
  const contentlayerContexts = getContexts({ includeDrafts }).map((context) => ({
    ...toContextMetadata(context),
    body: context.body.raw,
  }));
  const existing = new Set(contentlayerContexts.map((context) => context.slug));
  const diskContexts = await readDiskContexts(existing, includeDrafts);
  return [...contentlayerContexts, ...diskContexts].sort(
    (a, b) => new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime(),
  );
}

export async function getEditableContextBySlug(slug: string): Promise<AdminContext | undefined> {
  const context = getContextBySlug(slug);
  if (context) {
    return { ...toContextMetadata(context), body: context.body.raw };
  }
  const filePath = path.join(getContextsDirectory(), `${slug}.mdx`);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = matter(raw);
    const data = parsed.data as Record<string, unknown>;
    const isPublishedFlag = data.isPublished !== false;
    return {
      title: typeof data.title === 'string' ? data.title : slug,
      summary: typeof data.summary === 'string' ? data.summary : '',
      tags: Array.isArray(data.tags) ? data.tags.map((tag) => String(tag)) : [],
      slug,
      createdDate: typeof data.createdDate === 'string' ? data.createdDate : new Date().toISOString(),
      updatedDate: typeof data.updatedDate === 'string' ? data.updatedDate : new Date().toISOString(),
      isPublished: isPublishedFlag,
      body: parsed.content.trim(),
    };
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}
