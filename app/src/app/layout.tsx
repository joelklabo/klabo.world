import type { Metadata } from 'next';
import { JetBrains_Mono, Manrope } from 'next/font/google';
import './globals.css';
import { GlobalNavigation } from './components/global-navigation';
import ApplicationInsightsConnection from './components/ApplicationInsights';
import { env } from '@/lib/env';

export const metadata: Metadata = {
  metadataBase: new URL(env.SITE_URL),
  title: {
    template: '%s • klabo.world',
    default: 'klabo.world • Bitcoin, Lightning, Nostr & Agentic Engineering',
  },
  description:
    'klabo.world covers Bitcoin, Lightning, Nostr, and agentic engineering with tutorials, project updates, and AI context libraries.',
	  openGraph: {
	    type: 'website',
	    url: env.SITE_URL,
	    siteName: 'klabo.world',
	    title: 'klabo.world • Bitcoin, Lightning, Nostr & Agentic Engineering',
	    description:
	      'klabo.world covers Bitcoin, Lightning, Nostr, and agentic engineering with tutorials, project updates, and AI context libraries.',
	    images: [
	      {
	        url: new URL('/og.png', env.SITE_URL),
	        width: 1200,
	        height: 630,
	        alt: 'klabo.world',
	        type: 'image/png',
	      },
	    ],
	  },
	  twitter: {
	    card: 'summary_large_image',
	    title: 'klabo.world • Bitcoin, Lightning, Nostr & Agentic Engineering',
	    description:
	      'klabo.world covers Bitcoin, Lightning, Nostr, and agentic engineering with tutorials, project updates, and AI context libraries.',
	    images: [new URL('/og.png', env.SITE_URL)],
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
    <html lang="en">
      <body className={`${manrope.variable} ${jetbrains.variable} antialiased bg-background text-foreground`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 rounded-full border border-border/60 bg-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground shadow-[0_12px_30px_rgba(6,10,20,0.45)]"
        >
          Skip to content
        </a>
        <GlobalNavigation />
        <main id="main-content" className="min-h-screen">
          {children}
        </main>
        <ApplicationInsightsConnection />
      </body>
    </html>
  );
}
