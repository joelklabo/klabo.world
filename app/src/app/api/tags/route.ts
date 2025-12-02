import { NextResponse } from 'next/server';
import { getPostTagCloud, getCombinedTagCloud } from '@/lib/tagCloud';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.max(1, Number.parseInt(limitParam, 10)) : undefined;
  return NextResponse.json({
    posts: getPostTagCloud(limit),
    combined: getCombinedTagCloud(limit),
  });
}
