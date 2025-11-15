'use client';

import { useEffect, useState } from 'react';

async function loadCsrfToken() {
  const response = await fetch('/api/auth/csrf', {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('Unable to load login token. Please refresh and try again.');
  }
  const data = (await response.json()) as { csrfToken?: string };
  return data.csrfToken ?? '';
}

type LoginFormProps = {
  initialError?: string;
};

function resolveErrorMessage(code?: string) {
  if (!code) return null;
  if (code === 'CredentialsSignin') {
    return 'Invalid email or password.';
  }
  return 'Unable to sign in. Please try again.';
}

export function LoginForm({ initialError }: LoginFormProps) {
  const [csrfToken, setCsrfToken] = useState('');
  const [error, setError] = useState<string | null>(resolveErrorMessage(initialError));
  const [loadingToken, setLoadingToken] = useState(true);

  useEffect(() => {
    let active = true;
    loadCsrfToken()
      .then((token) => {
        if (active) {
          setCsrfToken(token);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to initialize login form.');
        }
      })
      .finally(() => {
        if (active) {
          setLoadingToken(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <form method="post" action="/api/auth/callback/credentials" className="flex flex-col gap-3 rounded border border-zinc-200 p-4">
      <input type="hidden" name="csrfToken" value={csrfToken} readOnly />
      <input type="hidden" name="callbackUrl" value="/admin" readOnly />
      <label className="text-sm font-medium text-zinc-600" htmlFor="email">
        Email
      </label>
      <input id="email" name="email" type="email" className="rounded border px-3 py-2" required />
      <label className="text-sm font-medium text-zinc-600" htmlFor="password">
        Password
      </label>
      <input id="password" name="password" type="password" className="rounded border px-3 py-2" required />
      <button type="submit" className="rounded bg-black px-4 py-2 text-white disabled:opacity-60" disabled={!csrfToken || loadingToken}>
        {loadingToken ? 'Preparing…' : 'Sign in'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
