import { describe, expect, it } from 'vitest';
import { GET as authErrorHandler } from '@/app/api/auth/error/route';

describe('/api/auth/error redirect', () => {
  it('redirects to /admin with error param', () => {
    const response = authErrorHandler(new Request('https://example.com/api/auth/error?error=Configuration'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://example.com/admin?error=Configuration');
  });
});
