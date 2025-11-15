'use client';

import { useCallback, useEffect, useState } from 'react';

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
  const normalized = code.toString();
  const map: Record<string, string> = {
    CredentialsSignin: 'Invalid email or password.',
    AccessDenied: 'Access denied. Please verify your credentials.',
    Configuration: 'Login is not configured correctly. Contact an admin.',
    SessionRequired: 'Please sign in to continue.',
  };
  if (map[normalized]) {
    return map[normalized];
  }
  return 'Unable to sign in. Please try again.';
}

export function LoginForm({ initialError }: LoginFormProps) {
  const [csrfToken, setCsrfToken] = useState('');
  const [error, setError] = useState<string | null>(resolveErrorMessage(initialError));
  const [toastMessage, setToastMessage] = useState<string | null>(resolveErrorMessage(initialError));
  const [loadingToken, setLoadingToken] = useState(true);

  const showError = useCallback((message: string | null) => {
    setError(message);
    setToastMessage(message);
  }, []);

  useEffect(() => {
    let active = true;
    loadCsrfToken()
      .then((token) => {
        if (active) {
          setCsrfToken(token);
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unable to initialize login form.';
        if (active) {
          showError(message);
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
  }, [showError]);

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }
    const timer = setTimeout(() => setToastMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  return (
    <>
      {toastMessage && (
        <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2 transform">
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-xl" role="alert">
            <span>{toastMessage}</span>
            <button
              type="button"
              className="text-red-500 transition hover:text-red-700"
              aria-label="Dismiss error"
              onClick={() => setToastMessage(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
      <form method="post" action="/api/auth/callback/credentials" className="flex flex-col gap-3 rounded border border-zinc-200 p-4">
        <input type="hidden" name="csrfToken" value={csrfToken} readOnly />
        <input type="hidden" name="callbackUrl" value="/admin" readOnly />
        <label className="text-sm font-medium text-zinc-600" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" className="rounded border px-3 py-2" autoComplete="username" required />
        <label className="text-sm font-medium text-zinc-600" htmlFor="password">
          Password
        </label>
        <input id="password" name="password" type="password" className="rounded border px-3 py-2" autoComplete="current-password" required />
        <button type="submit" className="rounded bg-black px-4 py-2 text-white disabled:opacity-60" disabled={!csrfToken || loadingToken}>
          {loadingToken ? 'Preparing…' : 'Sign in'}
        </button>
        {error && (
          <p className="text-sm text-red-600" role="alert" aria-live="assertive">
            {error}
          </p>
        )}
      </form>
    </>
  );
}
