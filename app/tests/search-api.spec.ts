import { describe, expect, it } from 'vitest';
import { GET as searchHandler } from '@/app/api/search/route';

const SEARCH_URL = 'https://example.com/api/search?q=bitcoin';

describe('api/search route', () => {
  it('redirects browser-style requests to the HTML search page', async () => {
    const request = new Request(SEARCH_URL, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'sec-fetch-mode': 'navigate',
      },
    });

    const response = await searchHandler(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://example.com/search?q=bitcoin');
  });

  it('returns JSON payload for API clients', async () => {
    const request = new Request(SEARCH_URL, {
      headers: {
        accept: 'application/json',
      },
    });

    const response = await searchHandler(request);
    expect(response.headers.get('content-type')).toContain('application/json');

    const payload = (await response.json()) as unknown;
    expect(Array.isArray(payload)).toBe(true);
    expect((payload as Array<{ title: string }>).length).toBeGreaterThan(0);
  });
});
