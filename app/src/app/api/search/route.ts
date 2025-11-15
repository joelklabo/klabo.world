import { NextResponse } from 'next/server';
import { searchContent } from '@/lib/search';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() ?? '';
  if (query.length < 2) {
    return NextResponse.json({ error: 'Search query must be at least 2 characters.' }, { status: 400 });
  }
  const results = searchContent(query);
  return NextResponse.json(results);
}
