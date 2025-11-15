import type { ReactNode } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { auth } from '@/lib/nextAuth';
import { SignOutButton } from './signout-button';

const navLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/compose', label: 'Compose' },
  { href: '/admin/apps', label: 'Apps' },
  { href: '/admin/contexts', label: 'Contexts' },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-lg font-semibold">
              Admin
            </Link>
            {session?.user && (
              <nav className="flex gap-3 text-sm text-gray-600 dark:text-gray-300">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href as Route} className="rounded-full px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-300">
            {session?.user ? (
              <div className="flex items-center gap-3">
                <span>{session.user.email}</span>
                <SignOutButton />
              </div>
            ) : (
              <Link href="/admin" className="rounded-full border border-gray-300 px-4 py-1 text-sm font-semibold text-gray-700 hover:border-gray-400">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
