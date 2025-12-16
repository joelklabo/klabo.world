import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { allPosts, type Post } from 'contentlayer/generated';
import { getPostsDirectory } from './postPersistence';

function getPublishDate(post: Post): Date {
  return new Date(post.publishDate ?? post.date);
}

function isPublished(post: Post, now = new Date()): boolean {
  return getPublishDate(post) <= now;
}

export function getPosts(options: { includeUnpublished?: boolean } = {}): Post[] {
  const now = new Date();
  return [...allPosts]
    .filter((post) => options.includeUnpublished || isPublished(post, now))
    .sort((a, b) => getPublishDate(b).getTime() - getPublishDate(a).getTime());
}

export function getRecentPosts(limit = 3): Post[] {
  return getPosts().slice(0, limit);
}

export function getPostBySlug(slug: string): Post | undefined {
  return allPosts.find((post) => post.slug === slug);
}

export function getPostTagCounts(): Record<string, number> {
  return getPosts().reduce<Record<string, number>>((acc, post) => {
    if (post.tags) for (const tag of post.tags) {
      const normalized = tag.trim();
      acc[normalized] = (acc[normalized] ?? 0) + 1;
    }
    return acc;
  }, {});
}

export type AdminPostSummary = {
  slug: string;
  title: string;
  summary: string;
  tags?: string[];
  date: string;
  publishDate?: string | null;
  lightningAddress?: string | null;
  nostrPubkey?: string | null;
  nostrRelays?: string[];
  nostrstackEnabled?: boolean | null;
};

function getAdminPublishDate(post: AdminPostSummary): Date {
  return new Date(post.publishDate ?? post.date);
}

export type EditablePost = AdminPostSummary & {
  featuredImage?: string | null;
  body: string;
};

async function readDiskPosts(exclude: Set<string>): Promise<AdminPostSummary[]> {
  const postsDir = getPostsDirectory();
  try {
    const files = await fs.readdir(postsDir);
    const entries: AdminPostSummary[] = [];
    for (const file of files) {
      if (!file.endsWith('.mdx')) continue;
      const slug = path.basename(file, '.mdx');
      if (exclude.has(slug)) continue;
      const raw = await fs.readFile(path.join(postsDir, file), 'utf8');
      const parsed = matter(raw);
      const data = parsed.data as Record<string, unknown>;
      const title = typeof data.title === 'string' ? data.title : slug;
      const summary = typeof data.summary === 'string' ? data.summary : '';
      const tags = Array.isArray(data.tags) ? data.tags.map(String) : undefined;
      const date = typeof data.date === 'string' ? data.date : new Date().toISOString().slice(0, 10);
      const publishDate = typeof data.publishDate === 'string' ? data.publishDate : null;
      const lightningAddress = typeof data.lightningAddress === 'string' ? data.lightningAddress : null;
      const nostrPubkey = typeof data.nostrPubkey === 'string' ? data.nostrPubkey : null;
      const nostrRelays = Array.isArray(data.nostrRelays)
        ? data.nostrRelays.map(String).filter(Boolean)
        : undefined;
      const nostrstackEnabled =
        typeof data.nostrstackEnabled === 'boolean' ? data.nostrstackEnabled : undefined;

      entries.push({
        slug,
        title,
        summary,
        tags,
        date,
        publishDate,
        lightningAddress,
        nostrPubkey,
        nostrRelays,
        nostrstackEnabled,
      });
    }
    return entries;
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function getPostsForAdmin(): Promise<AdminPostSummary[]> {
  const basePosts = getPosts({ includeUnpublished: true }).map<AdminPostSummary>((post) => ({
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    tags: post.tags,
    date: post.date,
    publishDate: post.publishDate ?? null,
    lightningAddress: post.lightningAddress ?? null,
    nostrPubkey: post.nostrPubkey ?? null,
    nostrRelays: post.nostrRelays ?? undefined,
    nostrstackEnabled: typeof post.nostrstackEnabled === 'boolean' ? post.nostrstackEnabled : undefined,
  }));
  const existing = new Set(basePosts.map((post) => post.slug));
  const diskPosts = await readDiskPosts(existing);
  return [...basePosts, ...diskPosts].sort(
    (a, b) => getAdminPublishDate(b).getTime() - getAdminPublishDate(a).getTime(),
  );
}

export async function getEditablePostBySlug(slug: string): Promise<EditablePost | undefined> {
  const contentlayerPost = getPostBySlug(slug);
  if (contentlayerPost) {
    return {
      slug: contentlayerPost.slug,
      title: contentlayerPost.title,
      summary: contentlayerPost.summary,
      tags: contentlayerPost.tags,
      date: contentlayerPost.date,
      publishDate: contentlayerPost.publishDate ?? null,
      featuredImage: contentlayerPost.featuredImage ?? null,
      lightningAddress: contentlayerPost.lightningAddress ?? null,
      nostrPubkey: contentlayerPost.nostrPubkey ?? null,
      nostrRelays: contentlayerPost.nostrRelays ?? undefined,
      nostrstackEnabled: typeof contentlayerPost.nostrstackEnabled === 'boolean' ? contentlayerPost.nostrstackEnabled : undefined,
      body: contentlayerPost.body.raw,
    };
  }
  const filePath = path.join(getPostsDirectory(), `${slug}.mdx`);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = matter(raw);
    const data = parsed.data as Record<string, unknown>;
    const title = typeof data.title === 'string' ? data.title : slug;
    const summary = typeof data.summary === 'string' ? data.summary : '';
    const tags = Array.isArray(data.tags) ? data.tags.map(String) : undefined;
    const date = typeof data.date === 'string' ? data.date : new Date().toISOString().slice(0, 10);
    const publishDate = typeof data.publishDate === 'string' ? data.publishDate : null;
    const featuredImage = typeof data.featuredImage === 'string' ? data.featuredImage : null;
    const lightningAddress = typeof data.lightningAddress === 'string' ? data.lightningAddress : null;
    const nostrPubkey = typeof data.nostrPubkey === 'string' ? data.nostrPubkey : null;
    const nostrRelays = Array.isArray(data.nostrRelays)
      ? data.nostrRelays.map(String).filter(Boolean)
      : undefined;
    const nostrstackEnabled = typeof data.nostrstackEnabled === 'boolean' ? data.nostrstackEnabled : undefined;
    return {
      slug,
      title,
      summary,
      tags,
      date,
      publishDate,
      featuredImage,
      lightningAddress,
      nostrPubkey,
      nostrRelays,
      nostrstackEnabled,
      body: parsed.content.trim(),
    };
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}
