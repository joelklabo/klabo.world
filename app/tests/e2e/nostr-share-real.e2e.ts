import { expect, test } from '@playwright/test';
import { Relay, finalizeEvent, generateSecretKey, getPublicKey, type EventTemplate } from 'nostr-tools';

async function waitForEventOnRelay(opts: { relayUrl: string; eventId: string; timeoutMs?: number }) {
  const timeoutMs = opts.timeoutMs ?? 12_000;

  try {
    const relay = await Relay.connect(opts.relayUrl, { enablePing: true, enableReconnect: true });
    return await new Promise<boolean>((resolve) => {
      let done = false;
      let sub: { close: () => void } | null = null;

      const finish = (found: boolean) => {
        if (done) return;
        done = true;
        try {
          sub?.close();
        } catch {
          // ignore
        }
        try {
          relay.close();
        } catch {
          // ignore
        }
        resolve(found);
      };

      const timer = setTimeout(() => finish(false), timeoutMs);
      sub = relay.subscribe([{ ids: [opts.eventId] }], {
        onevent: () => {
          clearTimeout(timer);
          finish(true);
        },
      });
    });
  } catch {
    return false;
  }
}

test('nostr share publishes a real note to relays (requires NOSTR_E2E_REAL=1)', async ({ page }) => {
  test.skip(process.env.NOSTR_E2E_REAL !== '1', 'Set NOSTR_E2E_REAL=1 to run against real relays.');

  const accountASecret = generateSecretKey();
  const accountAPubkey = getPublicKey(accountASecret);

  const accountBSecret = generateSecretKey();
  const accountBPubkey = getPublicKey(accountBSecret);

  await page.exposeFunction('__nostr_test_getPublicKey', async () => accountAPubkey);
  await page.exposeFunction('__nostr_test_signEvent', async (evt: EventTemplate) => {
    const signed = finalizeEvent(evt, accountASecret);
    return signed;
  });

  await page.addInitScript(() => {
    type NostrEventTemplate = {
      kind: number;
      tags: string[][];
      content: string;
      created_at: number;
    };

    type NostrSignedEvent = NostrEventTemplate & {
      id: string;
      sig: string;
      pubkey: string;
    };

    const w = window as unknown as {
      __nostr_test_getPublicKey: () => Promise<string>;
      __nostr_test_signEvent: (evt: NostrEventTemplate) => Promise<NostrSignedEvent>;
      __nostr_test_lastSignedEvent?: NostrSignedEvent;
      nostr?: {
        getPublicKey: () => Promise<string>;
        signEvent: (evt: NostrEventTemplate) => Promise<NostrSignedEvent>;
      };
    };

    w.nostr = {
      getPublicKey: async () => await w.__nostr_test_getPublicKey(),
      signEvent: async (evt: NostrEventTemplate) => {
        const signed = await w.__nostr_test_signEvent(evt);
        w.__nostr_test_lastSignedEvent = signed;
        return signed;
      },
    };
  });

  const slug = 'add-tipping-to-your-site-with-LNBits';
  await page.goto(`/posts/${slug}`, { waitUntil: 'domcontentloaded' });

  const shareButton = page.getByTestId('nostrstack-share');
  await expect(shareButton).toBeEnabled({ timeout: 30_000 });

  await shareButton.click();
  await expect(page.getByText('Shared to Nostr.')).toBeVisible({ timeout: 30_000 });

  const { eventId } = await page.evaluate<{ eventId?: string }>(() => {
    const w = window as unknown as { __nostr_test_lastSignedEvent?: { id?: string } };
    return { eventId: w.__nostr_test_lastSignedEvent?.id };
  });
  expect(eventId).toBeTruthy();

  const relayUrls = (process.env.NOSTRSTACK_RELAYS ?? '')
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => entry !== 'mock');

  expect(relayUrls.length, 'Set NOSTRSTACK_RELAYS to real relay URLs for this test.').toBeGreaterThan(0);

  const found = await Promise.any(
    relayUrls.map(async (relayUrl) => {
      const ok = await waitForEventOnRelay({ relayUrl, eventId });
      if (!ok) throw new Error(`event ${eventId} not observed on ${relayUrl}`);
      return true;
    }),
  ).catch(() => false);

  expect(found).toBe(true);
  expect(accountBPubkey).toHaveLength(64);
  expect(accountBSecret).toHaveLength(32);
});
