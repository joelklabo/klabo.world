import { NextResponse } from 'next/server';
import { getContexts, toContextMetadata } from '@/lib/contexts';

export const dynamic = 'force-dynamic';

export async function GET() {
  const contexts = getContexts().map(toContextMetadata);
  return NextResponse.json(contexts);
}
