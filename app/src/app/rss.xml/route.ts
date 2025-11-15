import { buildRssFeed } from '@/lib/feed';

export const dynamic = 'force-dynamic';

export async function GET() {
  const feed = buildRssFeed();
  return new Response(feed, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    },
  });
}
