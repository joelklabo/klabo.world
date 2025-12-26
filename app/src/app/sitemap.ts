import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';
import { getApps } from '@/lib/apps';
import { getPosts, getPostTagCounts } from '@/lib/posts';

function withBaseUrl(path: string) {
  const base = env.SITE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPosts();
  const apps = getApps();
  const tags = Object.keys(getPostTagCounts());

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: withBaseUrl('/'), changeFrequency: 'weekly', priority: 1 },
    { url: withBaseUrl('/posts'), changeFrequency: 'weekly', priority: 0.8 },
    { url: withBaseUrl('/posts/tags'), changeFrequency: 'monthly', priority: 0.4 },
    { url: withBaseUrl('/apps'), changeFrequency: 'monthly', priority: 0.6 },
    { url: withBaseUrl('/projects'), changeFrequency: 'weekly', priority: 0.6 },
    { url: withBaseUrl('/search'), changeFrequency: 'weekly', priority: 0.3 },
    { url: withBaseUrl('/rss.xml'), changeFrequency: 'weekly', priority: 0.2 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: withBaseUrl(`/posts/${post.slug}`),
    lastModified: new Date(post.publishDate ?? post.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const tagRoutes: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: withBaseUrl(`/posts/tag/${encodeURIComponent(tag)}`),
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  const appRoutes: MetadataRoute.Sitemap = apps.map((app) => ({
    url: withBaseUrl(`/apps/${app.slug}`),
    lastModified: new Date(app.publishDate),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [...staticRoutes, ...postRoutes, ...tagRoutes, ...appRoutes];
}
