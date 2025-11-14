'use client';

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email')?.toString() ?? '';
    const password = formData.get('password')?.toString() ?? '';
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError(result.error);
    } else {
      window.location.assign('/admin');
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded border border-zinc-200 p-4">
      <label className="text-sm font-medium text-zinc-600" htmlFor="email">
        Email
      </label>
      <input id="email" name="email" type="email" className="rounded border px-3 py-2" required />
      <label className="text-sm font-medium text-zinc-600" htmlFor="password">
        Password
      </label>
      <input id="password" name="password" type="password" className="rounded border px-3 py-2" required />
      <button type="submit" className="rounded bg-black px-4 py-2 text-white">
        Sign in
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
