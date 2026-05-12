import type { MetadataRoute } from 'next';
import { withPublicSiteUrl } from '@/lib/public-env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api'],
    },
    sitemap: withPublicSiteUrl('/sitemap.xml'),
  };
}
