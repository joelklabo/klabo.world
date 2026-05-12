import type { ReactNode } from 'react';

import { Surface } from '@/components/ui/surface';

type AdminListTableProps = {
  caption: string;
  children: ReactNode;
  tableClassName?: string;
  emptyState?: ReactNode;
};

export function AdminListTable({
  caption,
  children,
  tableClassName = 'min-w-full divide-y divide-border/60 text-sm',
  emptyState,
}: AdminListTableProps) {
  return (
    <Surface
      className="rounded-2xl shadow-[0_20px_45px_rgba(6,10,20,0.35)]"
      innerClassName="overflow-hidden rounded-2xl border border-border/60 bg-card"
    >
      <table className={tableClassName}>
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
      {emptyState}
    </Surface>
  );
}
