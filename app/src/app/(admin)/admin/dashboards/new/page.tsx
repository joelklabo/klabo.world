import { DashboardForm } from "@/app/(admin)/components/dashboard-form";
import { AdminSectionHeader } from '@/app/(admin)/components/admin-section-header';
import { AdminActionLink } from '@/app/(admin)/components/admin-action-link';
import { createDashboardAction } from "../actions";
import { runAdminPage } from '@/lib/adminPageHelpers';

export const dynamic = "force-dynamic";

export default async function NewDashboardPage() {
  return runAdminPage(async () => (
    <div className="space-y-6">
      <AdminSectionHeader
        label="Dashboards"
        title="New dashboard"
        description="Link Azure dashboards, graphs, or log searches so they’re one click away."
        action={
          <AdminActionLink
            variant="back"
            href="/admin/dashboards"
          >
            ← Back to dashboards
          </AdminActionLink>
        }
      />

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-[0_20px_45px_rgba(6,10,20,0.35)]">
        <DashboardForm
          action={createDashboardAction}
          submitLabel="Create dashboard"
        />
      </div>
    </div>
  ));
}
