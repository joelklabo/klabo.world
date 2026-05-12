export const SITE_NAME = 'klabo.world';
export const SITE_CANONICAL_URL = 'https://klabo.world';
export const SITE_TITLE = `${SITE_NAME} • Bitcoin, Lightning & Agentic Engineering`;
export const SITE_DESCRIPTION = 'Bitcoin, Lightning, and agentic engineering with tutorials, project updates, and AI context libraries.';
export const SITE_DESCRIPTION_WITHOUT_PERIOD = 'klabo.world covers Bitcoin, Lightning, and agentic engineering with tutorials, project updates, and AI context libraries.';
export const SITE_FEED_DESCRIPTION = 'Bitcoin, Lightning, Nostr & Agentic Engineering insights from klabo.world.';
export const SITE_TAGLINE = 'Bitcoin, Lightning & agentic engineering. Tutorials, project updates, and AI context libraries.';
export const DEFAULT_PAYMENT_HOST = 'pay.klabo.world';
export const DEFAULT_PAYMENT_URL = `https://${DEFAULT_PAYMENT_HOST}`;
export const DEFAULT_PAYMENT_TITLE = `Pay ${SITE_NAME}`;
export const DEFAULT_PAYMENT_DESCRIPTION = 'Lightning and on-chain Bitcoin payment options for klabo.world.';

export const DEFAULT_POST_OG_SUMMARY = 'Read the latest writing on klabo.world.';
export const DEFAULT_POST_LIGHTNING_ADDRESS = 'joel@klabo.world';
export const DEFAULT_LIGHTNING_ADDRESS = DEFAULT_POST_LIGHTNING_ADDRESS;
export const DEFAULT_LIGHTNING_NODE_ALIAS = SITE_NAME;
export const DEFAULT_LIGHTNING_NODE_HOST = 'lnbits.klabo.world';
export const DEFAULT_LIGHTNING_NODE_PUBKEY =
  '0276dc1ed542d0d777b518f1bd05f042847f19f312718cf1303288119a0a789a68';
export const DEFAULT_LIGHTNING_NODE_PORT = 9735;
export const DEFAULT_LIGHTNING_NODE_COLOR = '#f7931a';
export const DEFAULT_BITCOIN_ONCHAIN_ADDRESS = 'bc1qzafw20xpesnvwup6gmtx38e5j6ddjjdpc0zh78';
export const LIGHTNING_NAMESPACE_PREFIX = `${SITE_NAME}:`;
export const PRIMARY_HOST = SITE_NAME;
export const LEGACY_HOSTS = ['klabo.blog', 'www.klabo.blog'] as const;
export const PAYMENT_HOSTS = [DEFAULT_PAYMENT_HOST] as const;
