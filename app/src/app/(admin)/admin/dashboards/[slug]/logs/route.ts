import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/adminSession';
import { getDashboardBySlug } from '@/lib/dashboards';
import { loadDashboardLogs } from '@/lib/dashboardLogs';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  await requireAdminSession();
  const dashboard = getDashboardBySlug(slug);
  if (!dashboard) {
    return NextResponse.json({ message: 'Dashboard not found' }, { status: 404 });
  }

  const search = req.nextUrl.searchParams.get('search') ?? undefined;
  const severity = req.nextUrl.searchParams.get('severity') ?? undefined;
  const limitParam = Number(req.nextUrl.searchParams.get('limit'));
  const limit = Number.isFinite(limitParam) ? limitParam : undefined;

  const state = await loadDashboardLogs(dashboard, { search, severity, limit });
  return NextResponse.json(state);
}
