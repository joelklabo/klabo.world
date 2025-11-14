import { allPosts, type Post } from 'contentlayer/generated';

export function getPosts(): Post[] {
  return [...allPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): Post | undefined {
  return allPosts.find((post) => post.slug === slug);
}
