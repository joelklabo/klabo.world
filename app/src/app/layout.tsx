import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { GlobalNavigation } from './components/global-navigation';
import ApplicationInsightsConnection from './components/ApplicationInsights';

export const metadata: Metadata = {
  title: {
    template: '%s • klabo.world',
    default: 'klabo.world • Bitcoin, Lightning, Nostr & Agentic Engineering',
  },
  description:
    'klabo.world covers Bitcoin, Lightning, Nostr, and agentic engineering with tutorials, project updates, and AI context libraries.',
};

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <GlobalNavigation />
        <main className="min-h-screen">{children}</main>
        <ApplicationInsightsConnection />
      </body>
    </html>
  );
}
