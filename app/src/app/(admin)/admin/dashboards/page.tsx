import Link from "next/link";
import { getDashboards } from "@/lib/dashboards";
import { requireAdminSession } from "@/lib/adminSession";
import { Button } from "@/components/ui/button";
import { DashboardList } from "@/app/(admin)/components/dashboard-list";

export const dynamic = "force-dynamic";

export default async function AdminDashboardsPage() {
  await requireAdminSession();
  const dashboards = getDashboards();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Dashboards
          </p>
          <h1 className="text-3xl font-bold text-foreground">
            Monitor klabo.world
          </h1>
          <p className="text-sm text-muted-foreground">
            Track telemetry, logs, and runbooks inside the admin portal.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/admin/dashboards/new">+ New dashboard</Link>
        </Button>
      </div>

      <DashboardList initialDashboards={dashboards} />
    </div>
  );
}
