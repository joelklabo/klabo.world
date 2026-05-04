import { NextResponse } from 'next/server';
import { getLightningNodeStatus } from '@/lib/lightning-node-status';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const status = await getLightningNodeStatus();

  return NextResponse.json(status, {
    headers: {
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=120',
    },
  });
}
