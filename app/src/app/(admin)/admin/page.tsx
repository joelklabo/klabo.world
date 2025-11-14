import Link from 'next/link';
import { auth } from '@/lib/nextAuth';
import { LoginForm } from '../login-form';
import { SignOutButton } from '../signout-button';

export const dynamic = 'force-dynamic';

export default async function AdminLanding() {
  const session = await auth();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 py-16">
      <h1 className="text-3xl font-semibold">Admin Dashboard (WIP)</h1>
      {session?.user ? (
        <div className="flex flex-col gap-3 rounded border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p>Signed in as {session.user.email}. Admin tools will appear here once CRUD is implemented.</p>
          <SignOutButton />
        </div>
      ) : (
        <LoginForm />
      )}
      <Link href="/" className="text-blue-600">
        Back to home
      </Link>
    </div>
  );
}
