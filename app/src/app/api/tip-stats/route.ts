import { NextResponse } from 'next/server';
import { getLnbitsBaseUrl, buildLnbitsHeaders, getLnbitsAdminKey } from '@/lib/lnbits';

type Payment = {
  amount: number;
  pending: boolean | null;
  extra?: {
    comment?: string;
    tag?: string;
  };
};

type TipStats = {
  namespace: string;
  count: number;
  totalSats: number;
  largestTip: number;
};

// Cache stats for 60 seconds to avoid hammering LNbits
const statsCache = new Map<string, { data: TipStats; expires: number }>();
const CACHE_TTL = 60_000; // 1 minute

export async function GET(request: Request) {
  const url = new URL(request.url);
  const namespace = url.searchParams.get('ns') || 'default';
  const fullNamespace = `klabo.world:${namespace}`;
  
  // Check cache
  const cached = statsCache.get(namespace);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  }

  const baseUrl = getLnbitsBaseUrl();
  const headers = buildLnbitsHeaders();
  const adminKey = getLnbitsAdminKey();
  
  if (!adminKey) {
    return NextResponse.json({ error: 'lnbits_not_configured' }, { status: 500 });
  }

  try {
    // Fetch all payments (LNbits API)
    const res = await fetch(`${baseUrl}/api/v1/payments?limit=1000`, {
      headers: {
        ...headers,
        'X-Api-Key': adminKey,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'lnbits_api_error' }, { status: res.status });
    }

    const payments = (await res.json()) as Payment[];
    
    // Filter payments by namespace (in extra.comment) and only settled payments
    const namespacedPayments = payments.filter((p) => {
      if (p.pending !== false && p.pending !== null) return false; // Only settled payments
      if (p.amount <= 0) return false; // Only incoming payments
      const comment = p.extra?.comment || '';
      return comment === fullNamespace;
    });

    // Calculate stats
    const stats: TipStats = {
      namespace,
      count: namespacedPayments.length,
      totalSats: Math.round(namespacedPayments.reduce((sum, p) => sum + p.amount, 0) / 1000), // msat to sat
      largestTip: Math.round(Math.max(0, ...namespacedPayments.map((p) => p.amount)) / 1000),
    };

    // Cache the result
    statsCache.set(namespace, { data: stats, expires: Date.now() + CACHE_TTL });

    return NextResponse.json(stats, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  } catch {
    return NextResponse.json({ error: 'lnbits_unreachable' }, { status: 502 });
  }
}
