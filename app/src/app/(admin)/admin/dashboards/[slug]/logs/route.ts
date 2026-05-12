import { NextRequest, NextResponse } from 'next/server';
import { getDashboardBySlugForAdmin } from '@/lib/dashboards';
import { runAdminRoute, AdminRouteError } from '@/lib/adminRouteHelpers';
import { loadDashboardLogs } from '@/lib/dashboardLogs';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  return runAdminRoute(async () => {
    const { slug } = await context.params;
    const dashboard = await getDashboardBySlugForAdmin(slug);
    if (!dashboard) {
      throw new AdminRouteError('Dashboard not found', 404, { message: 'Dashboard not found' });
    }

    const search = req.nextUrl.searchParams.get('search') ?? undefined;
    const severity = req.nextUrl.searchParams.get('severity') ?? undefined;
    const limitParam = Number(req.nextUrl.searchParams.get('limit'));
    const limit = Number.isFinite(limitParam) ? limitParam : undefined;

    const state = await loadDashboardLogs(dashboard, { search, severity, limit });
    return NextResponse.json(state);
  });
}
