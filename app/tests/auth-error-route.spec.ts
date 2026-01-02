import { describe, expect, it } from 'vitest';
import { GET as authErrorHandler } from '@/app/api/auth/error/route';
import { authOptions } from '@/lib/authOptions';

describe('/api/auth/error redirect', () => {
  it('redirects to /admin with error param', () => {
    const response = authErrorHandler(new Request('https://example.com/api/auth/error?error=Configuration'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://example.com/admin?error=Configuration');
  });
});

describe('authOptions session policy', () => {
  it('uses bounded JWT session settings', () => {
    expect(authOptions.session?.strategy).toBe('jwt');
    expect(authOptions.session?.maxAge).toBe(60 * 60 * 12);
    expect(authOptions.session?.updateAge).toBe(60 * 60);
    expect(authOptions.jwt?.maxAge).toBe(60 * 60 * 12);
  });
});
