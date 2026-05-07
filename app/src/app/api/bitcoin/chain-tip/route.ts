import { NextResponse } from 'next/server';
import { getBitcoinChainSnapshot } from '@/lib/bitcoin-chain';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await getBitcoinChainSnapshot();

    return NextResponse.json(snapshot, {
      headers: {
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Bitcoin chain data unavailable' },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  }
}
