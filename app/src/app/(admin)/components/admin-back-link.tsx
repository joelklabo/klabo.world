import Link from 'next/link';
import type { HTMLAttributeAnchorTarget, ReactNode } from 'react';

type AdminBackLinkProps = {
  href: string;
  children: ReactNode;
  target?: HTMLAttributeAnchorTarget;
  rel?: string;
};

export function AdminBackLink({ href, children, target, rel }: AdminBackLinkProps) {
  return (
    <Link
      href={href}
      className="text-sm font-semibold text-muted-foreground hover:text-foreground rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      target={target}
      rel={target === '_blank' ? rel ?? 'noreferrer' : rel}
    >
      {children}
    </Link>
  );
}
