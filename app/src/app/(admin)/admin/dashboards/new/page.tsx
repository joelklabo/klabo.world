import Link from "next/link";
import { DashboardForm } from "@/app/(admin)/components/dashboard-form";
import { AdminSectionHeader } from '@/app/(admin)/components/admin-section-header';
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
          <Link
            href="/admin/dashboards"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            ← Back to dashboards
          </Link>
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
