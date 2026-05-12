import type { Metadata } from 'next';
import { JetBrains_Mono, Manrope } from 'next/font/google';
import './globals.css';
import { GlobalNavigation } from './components/global-navigation';
import ApplicationInsightsConnection from './components/ApplicationInsights';
import { getPublicSiteUrl, withPublicSiteUrl } from '@/lib/public-env';
import {
  DEFAULT_PAYMENT_HOST,
  SITE_DESCRIPTION_WITHOUT_PERIOD,
  SITE_NAME,
  SITE_TITLE,
} from '@/lib/site-config';

const siteUrl = getPublicSiteUrl();
const paymentHostChromeScript =
  `if(location.hostname==='${DEFAULT_PAYMENT_HOST}')document.documentElement.dataset.paymentHost='true'`;
const paymentHostChromeStyle = 'html[data-payment-host="true"] body > header{display:none}';
const publicOpenGraphImage = withPublicSiteUrl('/og.png');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: `%s • ${SITE_NAME}`,
    default: SITE_TITLE,
  },
  description: SITE_DESCRIPTION_WITHOUT_PERIOD,
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION_WITHOUT_PERIOD,
    images: [
      {
        url: publicOpenGraphImage,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION_WITHOUT_PERIOD,
    images: [publicOpenGraphImage],
  },
};

const manrope = Manrope({
  variable: '--font-manrope',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ colorScheme: 'dark' }}>
      <head>
        <style>{paymentHostChromeStyle}</style>
        <script dangerouslySetInnerHTML={{ __html: paymentHostChromeScript }} />
      </head>
      <body className={`${manrope.variable} ${jetbrains.variable} antialiased bg-background text-foreground`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 rounded-full border border-border/60 bg-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground shadow-[0_12px_30px_rgba(6,10,20,0.45)]"
        >
          Skip to content
        </a>
        <GlobalNavigation />
        <main id="main-content" className="min-h-dvh">
          {children}
        </main>
        <ApplicationInsightsConnection />
      </body>
    </html>
  );
}
