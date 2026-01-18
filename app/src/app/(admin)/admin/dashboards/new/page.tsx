import Link from "next/link";
import { DashboardForm } from "@/app/(admin)/components/dashboard-form";
import { createDashboardAction } from "../actions";
import { requireAdminSession } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

export default async function NewDashboardPage() {
  await requireAdminSession();
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Dashboards</p>
          <h1 className="text-3xl font-bold text-foreground">New dashboard</h1>
          <p className="text-sm text-muted-foreground">Link Azure dashboards, graphs, or log searches so they’re one click away.</p>
        </div>
        <Link
          href="/admin/dashboards"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          ← Back to dashboards
        </Link>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-[0_20px_45px_rgba(6,10,20,0.35)]">
        <DashboardForm
          action={createDashboardAction}
          submitLabel="Create dashboard"
        />
      </div>
    </div>
  );
}
