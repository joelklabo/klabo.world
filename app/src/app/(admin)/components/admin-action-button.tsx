import Link from 'next/link';
import type { ReactNode } from 'react';
import type { LinkProps } from 'next/link';

import { Button } from '@/components/ui/button';

type AdminActionButtonSize = 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';

type AdminActionButtonProps = {
  href: LinkProps['href'];
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
      <Link href={href}>{children}</Link>
    </Button>
  );
}
