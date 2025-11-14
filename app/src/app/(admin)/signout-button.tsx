'use client';

import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/admin' })}
      className="rounded border border-red-200 px-4 py-2 text-sm text-red-700"
    >
      Sign out
    </button>
  );
}
