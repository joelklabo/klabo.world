import { NextResponse } from 'next/server';
import { getBitcoinOnchainAddress } from '@/lib/bitcoin-onchain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET() {
  return NextResponse.json(getBitcoinOnchainAddress(), {
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
    },
  });
}
