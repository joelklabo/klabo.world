import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

type AdminActionButtonSize = 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';

type AdminActionButtonHref = Parameters<typeof Link>[0]['href'];

type AdminActionButtonProps = {
  href: AdminActionButtonHref | string;
  children: ReactNode;
  size?: AdminActionButtonSize;
};

export function AdminActionButton({
  href,
  children,
  size = 'lg',
}: AdminActionButtonProps) {
  return (
    <Button asChild size={size}>
      <Link href={href as AdminActionButtonHref}>{children}</Link>
    </Button>
  );
}
