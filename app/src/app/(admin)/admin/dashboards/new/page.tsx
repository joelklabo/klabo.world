import Link from 'next/link';
import { DashboardForm } from '@/app/(admin)/components/dashboard-form';
import { createDashboardAction } from '../actions';

export const dynamic = 'force-dynamic';

export default function NewDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-indigo-500">Dashboards</p>
          <h1 className="text-3xl font-bold">New dashboard</h1>
          <p className="text-sm text-gray-500">Link Azure dashboards, graphs, or log searches so they’re one click away.</p>
        </div>
        <Link href="/admin/dashboards" className="text-sm font-semibold text-gray-500 hover:text-gray-700">
          ← Back to dashboards
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <DashboardForm action={createDashboardAction} submitLabel="Create dashboard" />
      </div>
    </div>
  );
}
