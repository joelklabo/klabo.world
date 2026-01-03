import type { MetadataRoute } from 'next';
import { getPublicSiteUrl } from '@/lib/public-env';

export default function robots(): MetadataRoute.Robots {
  const base = getPublicSiteUrl();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
