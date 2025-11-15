import { buildJsonFeed } from '@/lib/feed';

export const dynamic = 'force-dynamic';

export async function GET() {
  const feed = buildJsonFeed();
  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      'Content-Type': 'application/feed+json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    },
  });
}
