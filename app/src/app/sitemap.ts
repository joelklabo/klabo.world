import type { MetadataRoute } from 'next';
import { withPublicSiteUrl } from '@/lib/public-env';
import { getApps } from '@/lib/apps';
import { getPostPublishDate, getPosts, getPostTagCounts } from '@/lib/posts';

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPosts();
  const apps = getApps();
  const tags = Object.keys(getPostTagCounts());

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: withPublicSiteUrl('/'), changeFrequency: 'weekly', priority: 1 },
    { url: withPublicSiteUrl('/posts'), changeFrequency: 'weekly', priority: 0.8 },
    { url: withPublicSiteUrl('/posts/tags'), changeFrequency: 'monthly', priority: 0.4 },
    { url: withPublicSiteUrl('/apps'), changeFrequency: 'monthly', priority: 0.6 },
    { url: withPublicSiteUrl('/projects'), changeFrequency: 'weekly', priority: 0.6 },
    { url: withPublicSiteUrl('/dashboards'), changeFrequency: 'weekly', priority: 0.5 },
    { url: withPublicSiteUrl('/about'), changeFrequency: 'monthly', priority: 0.4 },
    { url: withPublicSiteUrl('/search'), changeFrequency: 'weekly', priority: 0.3 },
    { url: withPublicSiteUrl('/rss.xml'), changeFrequency: 'weekly', priority: 0.2 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: withPublicSiteUrl(`/posts/${post.slug}`),
    lastModified: getPostPublishDate(post),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const tagRoutes: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: withPublicSiteUrl(`/posts/tag/${encodeURIComponent(tag)}`),
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  const appRoutes: MetadataRoute.Sitemap = apps.map((app) => ({
    url: withPublicSiteUrl(`/apps/${app.slug}`),
    lastModified: new Date(app.publishDate),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [...staticRoutes, ...postRoutes, ...tagRoutes, ...appRoutes];
}
