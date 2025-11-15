import { allPosts, type Post } from 'contentlayer/generated';

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
    post.tags?.forEach((tag) => {
      const normalized = tag.trim();
      acc[normalized] = (acc[normalized] ?? 0) + 1;
    });
    return acc;
  }, {});
}
