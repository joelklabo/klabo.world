'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MouseEvent, ReactNode } from 'react';

interface ViewTransitionLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  prefetch?: boolean;
  [key: string]: unknown;
}

export function ViewTransitionLink({
  href,
  children,
  className,
  prefetch,
  ...props
}: ViewTransitionLinkProps) {
  const router = useRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Only handle left clicks without modifiers
    if (
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }

    // Check if browser supports View Transitions API
    if (!document.startViewTransition) {
      return; // Fall back to default Link behavior
    }

    e.preventDefault();

    document.startViewTransition(() => {
      router.push(href);
    });
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={className}
      prefetch={prefetch}
      {...props}
    >
      {children}
    </Link>
  );
}
