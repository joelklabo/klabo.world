import type { Metadata } from 'next';
import { PaymentPageClient } from './payment-page-client';
import {
  DEFAULT_PAYMENT_DESCRIPTION,
  DEFAULT_PAYMENT_TITLE,
  DEFAULT_PAYMENT_URL,
  SITE_NAME,
} from '@/lib/site-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: DEFAULT_PAYMENT_TITLE,
  description: DEFAULT_PAYMENT_DESCRIPTION,
  alternates: {
    canonical: DEFAULT_PAYMENT_URL,
  },
  openGraph: {
    type: 'website',
    url: DEFAULT_PAYMENT_URL,
    siteName: SITE_NAME,
    title: DEFAULT_PAYMENT_TITLE,
    description: DEFAULT_PAYMENT_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: DEFAULT_PAYMENT_TITLE,
    description: DEFAULT_PAYMENT_DESCRIPTION,
  },
};

export default function PayPage() {
  return <PaymentPageClient />;
}
