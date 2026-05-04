import type { Metadata } from 'next';
import { PaymentPageClient } from './payment-page-client';

export const metadata: Metadata = {
  title: 'Pay klabo.world',
  description: 'Lightning and on-chain Bitcoin payment options for klabo.world.',
  alternates: {
    canonical: 'https://pay.klabo.world',
  },
  openGraph: {
    type: 'website',
    url: 'https://pay.klabo.world',
    siteName: 'klabo.world',
    title: 'Pay klabo.world',
    description: 'Lightning and on-chain Bitcoin payment options for klabo.world.',
  },
  twitter: {
    card: 'summary',
    title: 'Pay klabo.world',
    description: 'Lightning and on-chain Bitcoin payment options for klabo.world.',
  },
};

export default function PayPage() {
  return <PaymentPageClient />;
}
