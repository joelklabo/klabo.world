import Link from 'next/link';
import type { HTMLAttributeAnchorTarget, ReactNode } from 'react';

type AdminActionLinkVariant = 'muted' | 'primary';

type AdminActionLinkProps = {
  href: string;
  children: ReactNode;
  variant?: AdminActionLinkVariant;
  target?: HTMLAttributeAnchorTarget;
  rel?: string;
};

const variantStyles: Record<AdminActionLinkVariant, string> = {
  muted: 'text-muted-foreground hover:text-foreground',
  primary: 'text-primary hover:text-primary/80',
};

export function AdminActionLink({
  href,
  children,
  variant = 'muted',
  target,
  rel,
}: AdminActionLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-block rounded px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${variantStyles[variant]}`}
      target={target}
      rel={target === '_blank' ? rel ?? 'noreferrer' : rel}
    >
      {children}
    </Link>
  );
}
