import type { Metadata } from 'next';
import { JetBrains_Mono, Manrope } from 'next/font/google';
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
        <GlobalNavigation />
        <main className="min-h-screen">{children}</main>
        <ApplicationInsightsConnection />
      </body>
    </html>
  );
}
