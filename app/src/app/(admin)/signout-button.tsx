'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function SignOutButton() {
  return (
    <Button
      type="button"
      variant="destructive-outline"
      onClick={() => signOut({ callbackUrl: '/admin' })}
    >
      Sign out
    </Button>
  );
}
