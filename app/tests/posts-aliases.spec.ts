import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Post } from 'contentlayer/generated';

const posts = vi.hoisted(() => [] as Post[]);

vi.mock('contentlayer/generated', () => ({
  allPosts: posts,
}));

const { getPostBySlug } = await import('@/lib/posts');

const makePost = (slug: string, aliases: string[] = []): Post => ({
  _id: `posts/${slug}.mdx`,
  _raw: {
    sourceFilePath: `posts/${slug}.mdx`,
    sourceFileName: `${slug}.mdx`,
    sourceFileDir: 'posts',
    contentType: 'mdx',
    flattenedPath: `posts/${slug}`,
  } as Post['_raw'],
  type: 'Post',
  title: slug,
  summary: '',
  date: '2025-01-01T00:00:00.000Z',
  publishDate: '2025-01-01T00:00:00.000Z',
  status: 'published',
  tags: [],
  aliases,
  featuredImage: undefined,
  lightningAddress: undefined,
  nostrPubkey: undefined,
  nostrRelays: undefined,
  nostrstackEnabled: true,
  body: { raw: '', code: '' },
  slug,
  url: `/posts/${slug}`,
});

describe('getPostBySlug alias safeguards', () => {
  beforeEach(() => {
    posts.length = 0;
    vi.restoreAllMocks();
  });

  it('prefers canonical slug when alias collides with canonical slug', () => {
    posts.push(makePost('alpha', ['beta']), makePost('beta'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = getPostBySlug('beta');

    expect(result?.slug).toBe('beta');
    expect(warn).toHaveBeenCalled();
  });

  it('warns and ignores alias equal to canonical slug', () => {
    posts.push(makePost('gamma', ['gamma']));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = getPostBySlug('gamma');

    expect(result?.slug).toBe('gamma');
    expect(warn).toHaveBeenCalled();
  });

  it('warns on duplicate aliases and returns deterministic match', () => {
    posts.push(makePost('alpha', ['shared']), makePost('beta', ['shared']));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = getPostBySlug('shared');

    expect(result?.slug).toBe('alpha');
    expect(warn).toHaveBeenCalled();
  });

  it('returns undefined for unknown slug', () => {
    posts.push(makePost('alpha', ['beta']));

    expect(getPostBySlug('missing')).toBeUndefined();
  });
});
