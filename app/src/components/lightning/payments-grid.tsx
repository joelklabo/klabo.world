import { cn } from '@/lib/utils';
import { BitcoinOnchainCard } from './onchain-card';
import { LightningNodeCard } from './node-card';
import { LightningTipWidget } from './tip-widget';
import { resolveLightningNode } from '@/lib/lightning-node-uri';
import {
  DEFAULT_BITCOIN_ONCHAIN_ADDRESS,
  DEFAULT_LIGHTNING_ADDRESS,
} from '@/lib/site-config';

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
  const resolvedNode = resolveLightningNode(node);

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
        {...resolvedNode}
        className={cn('h-full', isTerminal && 'order-3 lg:order-1')}
      />
      <LightningTipWidget
        lightningAddress={DEFAULT_LIGHTNING_ADDRESS}
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

export { DEFAULT_BITCOIN_ONCHAIN_ADDRESS };
