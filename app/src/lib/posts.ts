import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { allPosts, type Post } from 'contentlayer/generated';
import { summarizePostMetadata, type AdminPostSummary } from './postFrontmatter';
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
      entries.push(
        summarizePostMetadata(parsed.data, {
          slug,
          titleFallback: slug,
          summaryFallback: '',
          date: typeof parsed.data.date === 'string' ? parsed.data.date : new Date().toISOString().slice(0, 10),
        }),
      );
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
  const basePosts = getPosts({ includeUnpublished: true }).map<AdminPostSummary>((post) =>
    summarizePostMetadata(post, {
      slug: post.slug,
      summaryFallback: post.summary,
      date: post.date,
      featuredImage: post.featuredImage ?? null,
      publishDateFallback: post.publishDate ?? null,
      titleFallback: post.title,
    }),
  );
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
      ...summarizePostMetadata(contentlayerPost, {
        slug: contentlayerPost.slug,
        titleFallback: contentlayerPost.title,
        summaryFallback: contentlayerPost.summary,
        date: contentlayerPost.date,
        featuredImage: contentlayerPost.featuredImage ?? null,
        publishDateFallback: contentlayerPost.publishDate ?? null,
      }),
      body: contentlayerPost.body.raw,
    };
  }
  const postsDir = await resolvePostsDirectory();
  const filePath = path.join(postsDir, `${slug}.mdx`);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = matter(raw);
    return {
      ...summarizePostMetadata(parsed.data, {
        slug,
        titleFallback: slug,
        summaryFallback: '',
        date: typeof parsed.data.date === 'string' ? parsed.data.date : new Date().toISOString().slice(0, 10),
      }),
      body: parsed.content.trim(),
    };
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}
