import { cn } from '@/lib/utils';
import { BitcoinOnchainCard } from './onchain-card';
import { LightningNodeCard } from './node-card';
import { LightningTipWidget } from './tip-widget';

const NODE_PUBKEY = '0276dc1ed542d0d777b518f1bd05f042847f19f312718cf1303288119a0a789a68';
const NODE_ALIAS = 'klabo.world';
const NODE_HOST = 'lnbits.klabo.world';
const NODE_PORT = 9735;
const NODE_COLOR = '#f7931a';
const LIGHTNING_ADDRESS = 'joel@klabo.world';

export const DEFAULT_BITCOIN_ONCHAIN_ADDRESS = 'bc1qzafw20xpesnvwup6gmtx38e5j6ddjjdpc0zh78';

type LightningNodeDetails = {
  alias?: string;
  pubkey?: string;
  host?: string;
  port?: number;
  color?: string;
};

type BitcoinPaymentsGridProps = {
  namespace: string;
  node?: LightningNodeDetails | null;
  bitcoinAddress?: string;
  className?: string;
  variant?: 'home' | 'terminal';
};

export function BitcoinPaymentsGrid({
  namespace,
  node,
  bitcoinAddress = DEFAULT_BITCOIN_ONCHAIN_ADDRESS,
  className,
  variant = 'home',
}: BitcoinPaymentsGridProps) {
  const isTerminal = variant === 'terminal';

  return (
    <div
      className={cn(
        isTerminal
          ? 'grid grid-cols-1 items-stretch gap-3 sm:gap-4 lg:auto-rows-fr lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,1fr)] xl:grid-cols-[minmax(0,0.92fr)_minmax(320px,1fr)_minmax(320px,0.96fr)]'
          : 'grid grid-cols-1 items-stretch gap-4 lg:auto-rows-fr lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)_minmax(330px,1fr)]',
        className,
      )}
    >
      <LightningNodeCard
        alias={node?.alias ?? NODE_ALIAS}
        pubkey={node?.pubkey ?? NODE_PUBKEY}
        color={node?.color ?? NODE_COLOR}
        host={node?.host ?? NODE_HOST}
        port={node?.port ?? NODE_PORT}
        className={cn('h-full', isTerminal && 'order-3 lg:order-1')}
      />
      <LightningTipWidget
        lightningAddress={LIGHTNING_ADDRESS}
        namespace={namespace}
        className={cn('h-full', isTerminal && 'order-1 lg:order-2')}
      />
      <BitcoinOnchainCard
        address={bitcoinAddress}
        className={cn('h-full', isTerminal && 'order-2 lg:order-3')}
      />
    </div>
  );
}
