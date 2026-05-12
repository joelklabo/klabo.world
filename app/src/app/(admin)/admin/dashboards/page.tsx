import Link from "next/link";
import { getDashboardsForAdmin } from "@/lib/dashboards";
import { AdminSectionHeader } from '@/app/(admin)/components/admin-section-header';
import { runAdminPage } from '@/lib/adminPageHelpers';
import { Button } from "@/components/ui/button";
import { DashboardList } from "@/app/(admin)/components/dashboard-list";

export const dynamic = "force-dynamic";

export default async function AdminDashboardsPage() {
  return runAdminPage(async () => {
    const dashboards = await getDashboardsForAdmin();

    return (
      <div className="space-y-6">
        <AdminSectionHeader
          label="Dashboards"
          title="Monitor klabo.world"
          description="Track telemetry, logs, and runbooks inside the admin portal."
          action={
            <Button asChild size="lg">
              <Link href="/admin/dashboards/new">+ New dashboard</Link>
            </Button>
          }
        />

        <DashboardList initialDashboards={dashboards} />
      </div>
    );
  });
}
