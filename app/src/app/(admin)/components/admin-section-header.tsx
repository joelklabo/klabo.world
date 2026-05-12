import type { ReactNode } from 'react';

type AdminSectionHeaderProps = {
  label: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

export function AdminSectionHeader({
  label,
  title,
  description,
  action,
}: AdminSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{label}</p>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
