import type { ReactNode } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { auth } from '@/lib/nextAuth';
import { SignOutButton } from './signout-button';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '/admin', label: 'Dashboard', id: 'dashboard' },
  { href: '/admin/compose', label: 'Compose', id: 'compose' },
  { href: '/admin/apps', label: 'Apps', id: 'apps' },
  { href: '/admin/dashboards', label: 'Dashboards', id: 'dashboards' },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl shadow-[0_20px_40px_rgba(6,10,20,0.35)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-lg font-semibold tracking-[0.18em] uppercase text-primary drop-shadow">
              Admin
            </Link>
            {session?.user && (
              <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-muted-foreground" data-testid="admin-nav">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href as Route}
                    className="rounded-full px-3 py-1 transition hover:bg-primary/10 hover:text-primary"
                    data-testid={`admin-nav-${link.id}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {session?.user ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline">{session.user.email}</span>
                <SignOutButton />
              </div>
            ) : (
              <Button asChild variant="soft" size="sm">
                <Link href="/admin">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
