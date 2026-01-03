import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { allPosts, type Post } from 'contentlayer/generated';
type PostsDirectoryLoader = () => Promise<string>;

const resolvePostsDirectory: PostsDirectoryLoader = async () => {
  const { getPostsDirectory } = await import('./postPersistence');
  return getPostsDirectory();
};

function getContentlayerPosts(): Post[] {
  return Array.isArray(allPosts) ? allPosts : [];
}

function getPublishDate(post: Post): Date {
  return new Date(post.publishDate ?? post.date);
}

export function normalizePostSlug(value: string): string {
  let normalized = value.trim().toLowerCase();
  while (normalized.startsWith('/')) {
    normalized = normalized.slice(1);
  }
  while (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

const aliasWarningKeys = new Set<string>();
let cachedAliasIndex: Map<string, Post> | null = null;
let cachedAliasPosts: Post[] | null = null;

function warnAliasOnce(key: string, message: string) {
  if (aliasWarningKeys.has(key)) return;
  aliasWarningKeys.add(key);
  console.warn(message);
}

function isPublished(post: Post, now = new Date()): boolean {
  return getPublishDate(post) <= now;
}

export function formatPostDate(
  value: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' ? value : '';
  }
  try {
    return date.toLocaleDateString(undefined, options);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function getPosts(options: { includeUnpublished?: boolean } = {}): Post[] {
  const now = new Date();
  return [...getContentlayerPosts()]
    .filter((post) => options.includeUnpublished || isPublished(post, now))
    .sort((a, b) => getPublishDate(b).getTime() - getPublishDate(a).getTime());
}

export function getRecentPosts(limit = 3): Post[] {
  return getPosts().slice(0, limit);
}

function buildAliasIndex(posts: Post[]): Map<string, Post> {
  const aliasIndex = new Map<string, Post>();
  const canonicalSlugs = new Set(posts.map((post) => normalizePostSlug(post.slug)));
  const sortedPosts = [...posts].sort((a, b) =>
    normalizePostSlug(a.slug).localeCompare(normalizePostSlug(b.slug)),
  );

  for (const post of sortedPosts) {
    const canonicalSlug = normalizePostSlug(post.slug);
    const aliases = Array.isArray(post.aliases) ? post.aliases : [];
    for (const alias of aliases) {
      if (typeof alias !== 'string') continue;
      const normalizedAlias = normalizePostSlug(alias);
      if (!normalizedAlias) continue;
      if (normalizedAlias === canonicalSlug) {
        warnAliasOnce(
          `alias-self:${canonicalSlug}`,
          `Post "${post.slug}" declares alias "${alias}" that matches its own slug.`,
        );
        continue;
      }
      if (canonicalSlugs.has(normalizedAlias)) {
        warnAliasOnce(
          `alias-canonical:${normalizedAlias}`,
          `Post "${post.slug}" declares alias "${alias}" that collides with canonical slug "${normalizedAlias}".`,
        );
        continue;
      }
      const existing = aliasIndex.get(normalizedAlias);
      if (existing) {
        warnAliasOnce(
          `alias-duplicate:${normalizedAlias}`,
          `Alias "${alias}" is declared by both "${existing.slug}" and "${post.slug}".`,
        );
        continue;
      }
      aliasIndex.set(normalizedAlias, post);
    }
  }

  return aliasIndex;
}

function getAliasIndex(posts: Post[]): Map<string, Post> {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return buildAliasIndex(posts);
  }
  if (cachedAliasIndex && cachedAliasPosts === posts) {
    return cachedAliasIndex;
  }
  cachedAliasPosts = posts;
  cachedAliasIndex = buildAliasIndex(posts);
  return cachedAliasIndex;
}

export function getPostBySlug(slug: string): Post | undefined {
  const normalizedSlug = normalizePostSlug(slug);
  const posts = getContentlayerPosts();
  const aliasIndex = getAliasIndex(posts);
  const directMatch = posts.find((post) => normalizePostSlug(post.slug) === normalizedSlug);
  if (directMatch) return directMatch;
  return aliasIndex.get(normalizedSlug);
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

type AdminPostSummary = {
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
  const postsDir = await resolvePostsDirectory();
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
  const postsDir = await resolvePostsDirectory();
  const filePath = path.join(postsDir, `${slug}.mdx`);
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
